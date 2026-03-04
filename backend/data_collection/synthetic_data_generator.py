"""
Synthetic Training Data Generator for FieldSync Pro
Creates realistic washing machine complaint examples for AI training
"""

import csv
import random
from datetime import datetime
import os


# Complaint templates - realistic variations of how customers describe issues
COMPLAINT_TEMPLATES = {
    # Door Issues
    "door_wont_latch": [
        "Door won't close properly, keeps popping open",
        "Can't get the door to latch, it bounces back",
        "Door won't stay closed when I try to start a cycle",
        "The door closes but won't lock, cycle won't start",
        "Door latch seems broken, won't catch"
    ],
    
    "door_wont_unlock": [
        "Door is stuck locked after cycle finished",
        "Can't open the door, it's still locked and cycle is done",
        "Door won't unlock even though wash is complete",
        "Stuck door, cycle ended 10 minutes ago but still locked"
    ],
    
    # Drain Issues  
    "wont_drain": [
        "Water won't drain, clothes are soaking wet",
        "Washer filled but won't drain the water out",
        "Standing water in the drum, won't drain",
        "Cycle gets stuck on drain, water just sits there",
        "F21 error showing, water won't drain",
        "Getting F21 code and water pooling at bottom"
    ],
    
    # Not Starting
    "completely_dead": [
        "Washer won't turn on at all, no lights",
        "Completely dead, no power, nothing happens",
        "Pushed power button, nothing, totally dead",
        "No lights, no sounds, won't start"
    ],
    
    "wont_start_cycle": [
        "Turns on but won't start the wash cycle",
        "Lights work but pressing start does nothing",
        "Door locks but cycle won't begin",
        "Stuck on the start screen, won't begin washing"
    ],
    
    # Vibration/Noise
    "excessive_vibration": [
        "Shaking violently during spin, moving across the floor",
        "Loud banging when spinning, whole machine shakes",
        "Vibrates so badly it walks across the laundry room",
        "Sounds like it's going to explode during spin cycle"
    ],
    
    "grinding_noise": [
        "Horrible grinding noise when running",
        "Metal on metal scraping sound during wash",
        "Grinding and squealing during agitation",
        "Makes terrible grinding noise, getting worse"
    ],
    
    # Leaking
    "door_leak": [
        "Water leaking from the door during wash",
        "Puddle forming under the door every cycle",
        "Door seal is leaking, water on the floor",
        "Leaks around the door, especially during spin"
    ],
    
    "bottom_leak": [
        "Water pooling under the machine",
        "Leak coming from somewhere underneath",
        "Water on floor after every load, not sure where from",
        "Leaking from the bottom, big puddle"
    ],
    
    # Wash Performance
    "detergent_residue": [
        "Clothes have white residue all over them",
        "Detergent not rinsing out, leaves white marks",
        "Soapy residue on clothes after wash",
        "Clothes come out with soap still on them"
    ],
    
    "clothes_still_dirty": [
        "Clothes don't get clean anymore",
        "Stains not coming out like they used to",
        "Wash cycle finishes but clothes still dirty",
        "Not cleaning properly, clothes still smell"
    ],
    
    # Cycle Issues
    "cycle_too_long": [
        "Wash cycle takes forever, over 3 hours",
        "Cycle time keeps extending, never finishes on time",
        "Says 45 minutes but actually takes 2+ hours",
        "Cycle runs way longer than it should"
    ],
    
    "stuck_in_cycle": [
        "Gets stuck mid-cycle, won't advance",
        "Cycle pauses and won't restart",
        "Stuck on rinse, been going for an hour",
        "Won't move to the next cycle phase"
    ],
    
    # Error Code Specific
    "f21_error": [
        "F21 error code, won't drain",
        "Getting F21, clothes soaking wet",
        "Error F21 showing on display",
        "F21 code flashing, what does this mean?"
    ],
    
    "f22_error": [
        "F22 error, door won't lock",
        "Error code F22, cycle won't start",
        "Getting F22 on the screen",
        "F22 door lock error showing"
    ],
    
    "de_error": [
        "dE error on Samsung washer",
        "Door error dE code showing",
        "Samsung showing dE, door won't unlock",
        "Getting dE error, what's wrong?"
    ]
}


# Map complaint types to common_issue_ids (from your database)
# You'll need to adjust these IDs based on your actual common_issues table
ISSUE_MAPPINGS = {
    "door_wont_latch": [1, 2],  # Door issues
    "door_wont_unlock": [7],
    "wont_drain": [70, 71],  # Drain issues (from your test results)
    "completely_dead": [15],  # Not starting issues
    "wont_start_cycle": [16, 17],
    "excessive_vibration": [45, 46],  # Noise/vibration
    "grinding_noise": [47, 48],
    "door_leak": [60, 61],  # Leaking
    "bottom_leak": [62, 63],
    "detergent_residue": [30, 31],  # Wash performance
    "clothes_still_dirty": [32, 33],
    "cycle_too_long": [40],  # Cycle issues
    "stuck_in_cycle": [41],
    "f21_error": [70],  # Error code specific
    "f22_error": [2],
    "de_error": [7]
}


# Error codes that might appear in complaints
ERROR_CODES = {
    "f21_error": "F21",
    "f22_error": "F22",
    "de_error": "dE"
}


def generate_training_data(num_examples=500):
    """
    Generate synthetic training examples
    
    Args:
        num_examples: Number of examples to generate
        
    Returns:
        List of training example dictionaries
    """
    print(f"\n{'='*80}")
    print(f"Generating {num_examples} synthetic training examples")
    print(f"{'='*80}\n")
    
    training_data = []
    complaint_types = list(COMPLAINT_TEMPLATES.keys())
    
    for i in range(num_examples):
        # Pick random complaint type
        complaint_type = random.choice(complaint_types)
        
        # Pick random complaint template
        complaint = random.choice(COMPLAINT_TEMPLATES[complaint_type])
        
        # Add some variation
        variations = [
            "",
            " Please help!",
            " Any ideas?",
            " What should I do?",
            " Is this fixable?",
            " How do I fix this?",
            " Need help ASAP",
            " Warranty just expired of course"
        ]
        complaint += random.choice(variations)
        
        # Get corresponding issue_id
        possible_issues = ISSUE_MAPPINGS.get(complaint_type, [1])
        actual_issue_id = random.choice(possible_issues)
        
        # Get error code if applicable
        error_code = ERROR_CODES.get(complaint_type, "")
        
        training_data.append({
            "complaint": complaint,
            "error_code": error_code,
            "actual_issue_id": actual_issue_id,
            "data_source": "synthetic",
            "source_url": "",
            "verified": True  # Mark as verified since we created it
        })
        
        if (i + 1) % 100 == 0:
            print(f"  Generated {i + 1}/{num_examples} examples")
    
    print(f"\n✅ Generated {len(training_data)} training examples")
    return training_data


def save_to_csv(training_data, filename="synthetic_training_data.csv"):
    """Save training data to CSV"""
    output_dir = "data_collection/collected_data"
    os.makedirs(output_dir, exist_ok=True)
    
    filepath = os.path.join(output_dir, filename)
    
    fieldnames = [
        "complaint",
        "error_code",
        "actual_issue_id",
        "data_source",
        "source_url",
        "verified"
    ]
    
    with open(filepath, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(training_data)
    
    print(f"\n✅ Saved to: {filepath}")
    return filepath


def import_to_database(csv_file):
    """
    Import training data to Supabase diagnosis_training_data table
    
    NOTE: You'll need to create an import script similar to import_error_codes.py
    """
    print(f"\n📋 Next step: Import to database")
    print(f"\nRun:")
    print(f"  python import_training_data.py {csv_file}")


if __name__ == "__main__":
    print("\n" + "🤖 "*20)
    print("FieldSync Pro - Synthetic Training Data Generator")
    print("🤖 "*20)
    
    # Generate data
    num_examples = 500  # Adjust this number
    training_data = generate_training_data(num_examples)
    
    # Save to CSV
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"synthetic_training_{timestamp}.csv"
    csv_file = save_to_csv(training_data, filename)
    
    # Next steps
    print(f"\n{'='*80}")
    print("✅ Generation complete!")
    print(f"{'='*80}")
    print(f"\nCreated {len(training_data)} training examples")
    print(f"\nNext steps:")
    print(f"1. Review {filename} to verify quality")
    print(f"2. Adjust issue_id mappings if needed")
    print(f"3. Import to diagnosis_training_data table")
    print(f"4. Generate more variations as needed")
    print()