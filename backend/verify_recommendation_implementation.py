"""
Verification script for Recommendation Engine implementation.

Checks that all required files exist and components are properly integrated.
"""

import sys
from pathlib import Path

# Colors for terminal output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
RESET = '\033[0m'


def check_file_exists(filepath, description):
    """Check if a file exists and return status."""
    path = Path(filepath)
    exists = path.exists()
    
    status = f"{GREEN}✓{RESET}" if exists else f"{RED}✗{RESET}"
    print(f"  {status} {description}")
    
    if exists:
        size = path.stat().st_size
        print(f"     Size: {size:,} bytes")
    
    return exists


def check_import(module_path, item_name, description):
    """Check if an item can be imported."""
    try:
        module = __import__(module_path, fromlist=[item_name])
        item = getattr(module, item_name, None)
        if item is not None:
            print(f"  {GREEN}✓{RESET} {description}")
            return True
        else:
            print(f"  {RED}✗{RESET} {description} - not found in module")
            return False
    except Exception as e:
        print(f"  {RED}✗{RESET} {description} - {e}")
        return False


def check_function_signature(func, expected_params):
    """Check if function has expected parameters."""
    import inspect
    sig = inspect.signature(func)
    params = list(sig.parameters.keys())
    
    missing = set(expected_params) - set(params)
    if missing:
        print(f"     {YELLOW}Warning:{RESET} Missing parameters: {missing}")
        return False
    
    print(f"     Parameters: {', '.join(expected_params)}")
    return True


def main():
    print("=" * 70)
    print("RECOMMENDATION ENGINE IMPLEMENTATION VERIFICATION")
    print("=" * 70)
    
    all_checks = []
    
    # Check 1: Core module file
    print("\n1. Core Module File")
    all_checks.append(check_file_exists(
        "services/recommendation_engine.py",
        "Recommendation engine module"
    ))
    
    # Check 2: Configuration file
    print("\n2. Configuration File")
    all_checks.append(check_file_exists(
        "artifacts/recommendation_config.json",
        "Recommendation configuration"
    ))
    
    # Check 3: Documentation
    print("\n3. Documentation")
    all_checks.append(check_file_exists(
        "../docs/RECOMMENDATION_ENGINE.md",
        "Technical documentation"
    ))
    all_checks.append(check_file_exists(
        "../RECOMMENDATION_ENGINE_SUMMARY.md",
        "Implementation summary"
    ))
    
    # Check 4: Test files
    print("\n4. Test Files")
    all_checks.append(check_file_exists(
        "test_recommendation_engine.py",
        "Unit tests"
    ))
    all_checks.append(check_file_exists(
        "test_integration_mock.py",
        "Integration tests"
    ))
    
    # Check 5: Import capability
    print("\n5. Import Checks")
    sys.path.insert(0, str(Path(__file__).parent))
    
    all_checks.append(check_import(
        "services.recommendation_engine",
        "generate_healthcare_recommendation",
        "Main function import"
    ))
    
    # Check 6: Function signature
    print("\n6. Function Signature")
    try:
        from services.recommendation_engine import generate_healthcare_recommendation
        expected_params = [
            "severity_result",
            "disease_predictions", 
            "chronic_risks",
            "treatment_options"
        ]
        all_checks.append(check_function_signature(
            generate_healthcare_recommendation,
            expected_params
        ))
    except Exception as e:
        print(f"  {RED}✗{RESET} Could not verify signature: {e}")
        all_checks.append(False)
    
    # Check 7: Artifacts integration
    print("\n7. Artifacts Integration")
    try:
        from services.artifacts import get_artifacts
        art = get_artifacts()
        
        # Check if recommendation_config property exists
        if hasattr(art, 'recommendation_config'):
            print(f"  {GREEN}✓{RESET} recommendation_config property exists")
            all_checks.append(True)
        else:
            print(f"  {RED}✗{RESET} recommendation_config property missing")
            all_checks.append(False)
            
    except Exception as e:
        print(f"  {RED}✗{RESET} Artifacts integration check failed: {e}")
        all_checks.append(False)
    
    # Check 8: Engine integration
    print("\n8. Engine Integration")
    try:
        import inspect
        from services.engine import MedAssistEngine
        
        # Check if analyze method mentions recommendation
        source = inspect.getsource(MedAssistEngine.analyze)
        if "generate_healthcare_recommendation" in source:
            print(f"  {GREEN}✓{RESET} Engine calls generate_healthcare_recommendation")
            all_checks.append(True)
        else:
            print(f"  {RED}✗{RESET} Engine doesn't call recommendation function")
            all_checks.append(False)
            
        if '"recommendation":' in source:
            print(f"  {GREEN}✓{RESET} Engine includes recommendation in response")
            all_checks.append(True)
        else:
            print(f"  {RED}✗{RESET} Engine doesn't add recommendation to response")
            all_checks.append(False)
            
    except Exception as e:
        print(f"  {RED}✗{RESET} Engine integration check failed: {e}")
        all_checks.append(False)
        all_checks.append(False)
    
    # Check 9: Configuration structure
    print("\n9. Configuration Structure")
    try:
        import json
        with open("artifacts/recommendation_config.json") as f:
            config = json.load(f)
        
        required_keys = [
            "severity_actions",
            "chronic_risk_threshold",
            "preventive_care_templates",
            "specialist_priority_map",
            "red_flag_patterns",
            "disclaimer"
        ]
        
        for key in required_keys:
            if key in config:
                print(f"  {GREEN}✓{RESET} Config has '{key}'")
                all_checks.append(True)
            else:
                print(f"  {RED}✗{RESET} Config missing '{key}'")
                all_checks.append(False)
                
    except Exception as e:
        print(f"  {RED}✗{RESET} Configuration check failed: {e}")
        for _ in required_keys:
            all_checks.append(False)
    
    # Summary
    print("\n" + "=" * 70)
    passed = sum(all_checks)
    total = len(all_checks)
    percentage = (passed / total * 100) if total > 0 else 0
    
    if passed == total:
        print(f"{GREEN}✓ ALL CHECKS PASSED{RESET} ({passed}/{total})")
        print("\nImplementation is complete and ready for use!")
    elif percentage >= 80:
        print(f"{YELLOW}⚠ MOSTLY COMPLETE{RESET} ({passed}/{total} - {percentage:.0f}%)")
        print(f"\n{total - passed} checks failed. Review output above.")
    else:
        print(f"{RED}✗ IMPLEMENTATION INCOMPLETE{RESET} ({passed}/{total} - {percentage:.0f}%)")
        print(f"\n{total - passed} checks failed. Review output above.")
    
    print("=" * 70)
    
    return passed == total


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
