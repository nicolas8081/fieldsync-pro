import csv
import sys
import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# Supabase connection
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Error: SUPABASE_URL and SUPABASE_KEY must be set in .env file")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def import_training_data(csv_file):
    """
    Import training data from CSV to diagnosis_training_data table
    
    Args:
        csv_file: Path to CSV file
    """
    print(f"\n{'='*80}")
    print(f"Importing training data from: {csv_file}")
    print(f"{'='*80}\n")
    
    if not os.path.exists(csv_file):
        print(f"❌ Error: File not found: {csv_file}")
        return
    
    # Read CSV
    training_data = []
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Convert empty strings to None for database
            training_data.append({
                "customer_complaint": row["complaint"],
                "error_code": row["error_code"] if row["error_code"] else None,
                "actual_issue_id": int(row["actual_issue_id"]) if row["actual_issue_id"] else None,
                "data_source": row["data_source"],
                "source_url": row.get("source_url", ""),
                "verified": row.get("verified", "True").lower() == "true"
            })
    
    print(f"📊 Read {len(training_data)} examples from CSV")
    
    # Insert to Supabase in batches (Supabase has 1000 row limit per insert)
    batch_size = 100
    total_inserted = 0
    
    for i in range(0, len(training_data), batch_size):
        batch = training_data[i:i + batch_size]
        
        try:
            result = supabase.table("diagnosis_training_data").insert(batch).execute()
            total_inserted += len(batch)
            print(f"  ✅ Inserted batch {i//batch_size + 1}: {len(batch)} rows (total: {total_inserted})")
        except Exception as e:
            print(f"  ❌ Error inserting batch {i//batch_size + 1}: {e}")
            continue
    
    print(f"\n{'='*80}")
    print(f"✅ Import complete!")
    print(f"{'='*80}")
    print(f"Total rows inserted: {total_inserted}/{len(training_data)}")
    
    # Verify
    try:
        count_result = supabase.table("diagnosis_training_data").select("id", count="exact").execute()
        total_in_db = count_result.count
        print(f"\nTotal rows in diagnosis_training_data table: {total_in_db}")
    except Exception as e:
        print(f"\n⚠️  Could not verify total count: {e}")


def clear_existing_data():
    """
    Clear all existing training data (use with caution!)
    """
    print("\n⚠️  WARNING: This will delete ALL existing training data!")
    confirm = input("Type 'DELETE ALL' to confirm: ")
    
    if confirm == "DELETE ALL":
        try:
            result = supabase.table("diagnosis_training_data").delete().neq("id", 0).execute()
            print("✅ All training data deleted")
        except Exception as e:
            print(f"❌ Error deleting data: {e}")
    else:
        print("❌ Cancelled")


if __name__ == "__main__":
    print("\n" + "📥 "*20)
    print("FieldSync Pro - Training Data Import")
    print("📥 "*20)
    
    # Check command line arguments
    if len(sys.argv) < 2:
        print("\n❌ Usage: python import_training_data.py <csv_file>")
        print("\nExample:")
        print("  python import_training_data.py data_collection/collected_data/synthetic_training_20260304.csv")
        exit(1)
    
    csv_file = sys.argv[1]
    
    # Optional: Clear existing data first
    # clear_existing_data()
    
    # Import
    import_training_data(csv_file)
    
    print("\n✅ Done! Your training data is now in Supabase")
    print("\nNext steps:")
    print("1. Test the diagnose endpoint with new data")
    print("2. Generate more variations if needed")
    print("3. Start training AI model (Week 5-6)\n")