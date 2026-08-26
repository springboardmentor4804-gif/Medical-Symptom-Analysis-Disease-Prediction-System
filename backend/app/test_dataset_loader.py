from dataset_loader import load_all_datasets


patient_profile, disease_dataset, symptom_severity = load_all_datasets()


print("Datasets loaded successfully!")

print(f"Patient Profile Dataset: {patient_profile.shape}")
print(f"Disease Dataset: {disease_dataset.shape}")
print(f"Symptom Severity Dataset: {symptom_severity.shape}")
