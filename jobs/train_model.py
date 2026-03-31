"""
Train late-delivery model using shop.db data and save as late_delivery_model.sav.
"""

import sqlite3
import json
from pathlib import Path
from datetime import datetime

import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import classification_report, roc_auc_score
import joblib

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DB_PATH = PROJECT_ROOT / "shop.db"
MODEL_PATH = PROJECT_ROOT / "late_delivery_model.sav"

conn = sqlite3.connect(str(DB_PATH))

df = pd.read_sql("""
    SELECT
        o.order_id,
        o.order_subtotal,
        o.shipping_fee,
        o.order_total,
        o.order_datetime,
        o.promo_used,
        s.promised_days,
        s.actual_days,
        s.late_delivery,
        s.carrier,
        s.shipping_method,
        s.distance_band,
        c.birthdate,
        c.customer_id,
        c.gender,
        c.customer_segment
    FROM orders o
    JOIN shipments s ON s.order_id = o.order_id
    JOIN customers c ON o.customer_id = c.customer_id
""", conn)
conn.close()

df["order_datetime"] = pd.to_datetime(df["order_datetime"])
df["birthdate"] = pd.to_datetime(df["birthdate"])
df["customer_age"] = (df["order_datetime"] - df["birthdate"]).dt.days // 365
df["order_hour"] = df["order_datetime"].dt.hour
df["order_dow"] = df["order_datetime"].dt.dayofweek

order_counts = df.groupby("customer_id")["order_id"].transform("count")
df["customer_order_count"] = order_counts

numeric_features = [
    "order_subtotal", "shipping_fee", "order_total", "promo_used",
    "promised_days", "customer_age", "customer_order_count",
    "order_hour", "order_dow",
]
categorical_features = ["carrier", "shipping_method", "distance_band", "gender", "customer_segment"]

label_col = "late_delivery"

X = df[numeric_features + categorical_features]
y = df[label_col].astype(int)

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.25, random_state=42, stratify=y
)

numeric_transformer = Pipeline(steps=[
    ("imputer", SimpleImputer(strategy="median")),
    ("scaler", StandardScaler()),
])

categorical_transformer = Pipeline(steps=[
    ("imputer", SimpleImputer(strategy="most_frequent")),
    ("encoder", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
])

preprocessor = ColumnTransformer(transformers=[
    ("num", numeric_transformer, numeric_features),
    ("cat", categorical_transformer, categorical_features),
])

pipeline = Pipeline(steps=[
    ("preprocessor", preprocessor),
    ("classifier", GradientBoostingClassifier(
        n_estimators=200, learning_rate=0.1, max_depth=4, random_state=42
    )),
])

pipeline.fit(X_train, y_train)

y_pred = pipeline.predict(X_test)
y_prob = pipeline.predict_proba(X_test)[:, 1]

print(classification_report(y_test, y_pred, target_names=["On-time", "Late"]))
print(f"ROC-AUC: {roc_auc_score(y_test, y_prob):.4f}")

joblib.dump(pipeline, str(MODEL_PATH))
print(f"\nModel saved to {MODEL_PATH}")

metadata = {
    "model_name": "late_delivery_pipeline",
    "model_version": "1.0.0",
    "trained_at_utc": datetime.utcnow().isoformat(),
    "num_training_rows": int(X_train.shape[0]),
    "features": numeric_features + categorical_features,
}

with open(PROJECT_ROOT / "model_metadata.json", "w") as f:
    json.dump(metadata, f, indent=2)

print("Done.")
