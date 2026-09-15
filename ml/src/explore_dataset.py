import pandas as pd

df = pd.read_csv("D:\MedAssist_AI\datasets\dataset.csv")

print("=" * 60)

print("Shape")

print(df.shape)

print("=" * 60)

print("Columns")

print(df.columns)

print("=" * 60)

print(df.head())

print("=" * 60)

print("Missing Values")

print(df.isnull().sum())

print("=" * 60)

print("Unique Diseases")

print(df["Disease"].nunique())

print("=" * 60)

print(df["Disease"].value_counts())