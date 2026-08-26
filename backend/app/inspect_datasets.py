import pandas as pd

#load datasets
patient_profile_df=pd.read_csv(r"C:\Users\Hemanth\Documents\Projects_2026\MedAssist-AI\datasets\Disease_symptom_and_patient_profile_dataset.csv")
training_df = pd.read_csv(
    r"C:\Users\Hemanth\Documents\Projects_2026\MedAssist-AI\datasets\trainings.csv",
    encoding="latin1"
)
testing_df=pd.read_csv(
    r"C:\Users\Hemanth\Documents\Projects_2026\MedAssist-AI\datasets\testing.csv",
    encoding="latin1"
)


# Function to display basic dataset information
def inspect_dataset(name, dataframe):
    print(f"\n{'=' * 60}")
    print(f"{name}")
    print(f"{'=' * 60}")

    print(f"Rows: {dataframe.shape[0]}")
    print(f"Columns: {dataframe.shape[1]}")

    print("\nFirst 20 Column Names:")
    print(dataframe.columns[:20].tolist())

    print("\nLast 10 Column Names:")
    print(dataframe.columns[-10:].tolist())

    print("\nData Types:")
    print(dataframe.dtypes.value_counts())

    print("\nTotal Missing Values:")
    print(dataframe.isnull().sum().sum())

    print("\nFirst 5 Rows:")
    print(dataframe.head())


inspect_dataset(
    "Disease Symptom and Patient Profile Dataset",
    patient_profile_df
)

inspect_dataset(
    "Disease Prediction Training Dataset",
    training_df
)

inspect_dataset(
    "Disease Prediction Testing Dataset",
    testing_df
)