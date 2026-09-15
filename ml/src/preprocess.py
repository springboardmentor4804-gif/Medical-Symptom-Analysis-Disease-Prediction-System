import pandas as pd

# Load dataset
df = pd.read_csv("D:\MedAssist_AI\datasets\dataset.csv")

# Replace missing values
df = df.fillna("None")

print(df.head())

print("\nMissing Values")

print(df.isnull().sum())