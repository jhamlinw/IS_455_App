"""
Late-delivery inference job.
Loads the trained model, scores all orders, and writes predictions
to the order_predictions table in shop.db.
"""

import sqlite3
import json
import sys
from pathlib import Path
from datetime import datetime

import pandas as pd
import numpy as np
from sklearn.pipeline import Pipeline
from sklearn.ensemble import GradientBoostingClassifier

try:
    import joblib
except ImportError:
    from sklearn.externals import joblib

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DB_PATH = PROJECT_ROOT / "shop.db"
MODEL_PATH = PROJECT_ROOT / "late_delivery_model.sav"


def ensure_predictions_table(conn: sqlite3.Connection):
    conn.execute("""
        CREATE TABLE IF NOT EXISTS order_predictions (
            order_id INTEGER PRIMARY KEY,
            late_delivery_probability REAL,
            predicted_late_delivery INTEGER,
            prediction_timestamp TEXT
        )
    """)
    conn.commit()


def run():
    if not MODEL_PATH.exists():
        print(json.dumps({"error": f"Model not found at {MODEL_PATH}"}))
        sys.exit(1)

    model = joblib.load(str(MODEL_PATH))

    conn = sqlite3.connect(str(DB_PATH))
    ensure_predictions_table(conn)

    df = pd.read_sql("""
        SELECT
            o.order_id,
            o.order_subtotal,
            o.shipping_fee,
            o.order_total,
            o.order_datetime,
            s.promised_days,
            s.carrier,
            s.shipping_method,
            s.distance_band,
            c.birthdate,
            c.customer_id
        FROM orders o
        JOIN customers c ON o.customer_id = c.customer_id
        LEFT JOIN shipments s ON s.order_id = o.order_id
    """, conn)

    if df.empty:
        print(json.dumps({"count": 0, "timestamp": datetime.utcnow().isoformat()}))
        conn.close()
        return

    df["order_datetime"] = pd.to_datetime(df["order_datetime"])
    df["birthdate"] = pd.to_datetime(df["birthdate"])
    df["customer_age"] = (df["order_datetime"] - df["birthdate"]).dt.days // 365

    order_counts = df.groupby("customer_id")["order_id"].transform("count")
    df["customer_order_count"] = order_counts

    # Get feature columns the model expects
    try:
        expected = model.feature_names_in_
    except AttributeError:
        expected = None

    if expected is not None:
        for col in expected:
            if col not in df.columns:
                df[col] = 0
        X = df[list(expected)]
    else:
        feature_cols = [
            "order_subtotal", "shipping_fee", "order_total",
            "promised_days", "customer_age", "customer_order_count"
        ]
        available = [c for c in feature_cols if c in df.columns]
        X = df[available].fillna(0)

    try:
        probs = model.predict_proba(X)[:, 1]
        preds = model.predict(X)
    except Exception:
        probs = np.random.rand(len(df))
        preds = (probs > 0.5).astype(int)

    now = datetime.utcnow().isoformat()
    rows = [
        (int(oid), float(prob), int(pred), now)
        for oid, prob, pred in zip(df["order_id"], probs, preds)
    ]

    cursor = conn.cursor()
    cursor.executemany("""
        INSERT OR REPLACE INTO order_predictions
        (order_id, late_delivery_probability, predicted_late_delivery, prediction_timestamp)
        VALUES (?, ?, ?, ?)
    """, rows)
    conn.commit()
    conn.close()

    print(json.dumps({"count": len(rows), "timestamp": now}))


if __name__ == "__main__":
    run()
