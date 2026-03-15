"""
FieldSync Pro - AI Model Training
Train TF-IDF + Naive Bayes classifier for complaint diagnosis
"""

import os
import pickle
from datetime import datetime
from supabase import create_client
from dotenv import load_dotenv
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix
import numpy as np

# Load environment
load_dotenv()

# Supabase connection
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


def fetch_training_data():
    """
    Fetch all training data from diagnosis_training_data table
    
    Returns:
        complaints: List of complaint texts
        issue_ids: List of corresponding issue IDs
    """
    print("\n" + "="*80)
    print("FETCHING TRAINING DATA FROM SUPABASE")
    print("="*80 + "\n")
    
    result = supabase.table("diagnosis_training_data")\
        .select("customer_complaint, actual_issue_id")\
        .execute()
    
    data = result.data
    
    complaints = [row["customer_complaint"] for row in data]
    issue_ids = [row["actual_issue_id"] for row in data]
    
    print(f"✅ Fetched {len(complaints)} training examples")
    print(f"   Unique issues: {len(set(issue_ids))}")
    
    return complaints, issue_ids


def preprocess_text(text):
    """
    Simple text preprocessing
    
    Args:
        text: Raw complaint text
        
    Returns:
        Cleaned text
    """
    # Convert to lowercase
    text = text.lower()
    
    # Remove extra whitespace
    text = ' '.join(text.split())
    
    return text


def train_model(complaints, issue_ids, test_size=0.2):
    """
    Train TF-IDF + Naive Bayes classifier
    
    Args:
        complaints: List of complaint texts
        issue_ids: List of issue IDs
        test_size: Fraction of data for testing (default 0.2 = 20%)
        
    Returns:
        vectorizer: Trained TF-IDF vectorizer
        classifier: Trained Naive Bayes classifier
        X_test: Test features
        y_test: Test labels
    """
    print("\n" + "="*80)
    print("TRAINING AI MODEL")
    print("="*80 + "\n")
    
    # Preprocess
    print("1. Preprocessing text...")
    complaints = [preprocess_text(c) for c in complaints]
    
    # Split train/test
    print(f"2. Splitting data (train: {int((1-test_size)*100)}%, test: {int(test_size*100)}%)...")
    X_train, X_test, y_train, y_test = train_test_split(
        complaints, issue_ids, 
        test_size=test_size, 
        random_state=42,
    )
    
    print(f"   Training examples: {len(X_train)}")
    print(f"   Testing examples: {len(X_test)}")
    
    # TF-IDF Vectorization
    print("\n3. Training TF-IDF vectorizer...")
    vectorizer = TfidfVectorizer(
        max_features=1000,  # Top 1000 most important words
        ngram_range=(1, 2),  # Unigrams and bigrams
        min_df=2,  # Ignore words that appear in fewer than 2 documents
        max_df=0.8,  # Ignore words that appear in more than 80% of documents
        stop_words='english'  # Remove common English words
    )
    
    X_train_tfidf = vectorizer.fit_transform(X_train)
    X_test_tfidf = vectorizer.transform(X_test)
    
    print(f"   Vocabulary size: {len(vectorizer.vocabulary_)}")
    print(f"   Feature matrix shape: {X_train_tfidf.shape}")
    
    # Train Naive Bayes
    print("\n4. Training Naive Bayes classifier...")
    classifier = MultinomialNB(alpha=1.0)  # alpha=1.0 is Laplace smoothing
    classifier.fit(X_train_tfidf, y_train)
    
    print("   ✅ Model trained successfully!")
    
    return vectorizer, classifier, X_test_tfidf, y_test


def evaluate_model(classifier, X_test, y_test):
    """
    Evaluate model performance
    
    Args:
        classifier: Trained classifier
        X_test: Test features
        y_test: True labels
    """
    print("\n" + "="*80)
    print("EVALUATING MODEL PERFORMANCE")
    print("="*80 + "\n")
    
    # Make predictions
    y_pred = classifier.predict(X_test)
    
    # Calculate accuracy
    accuracy = accuracy_score(y_test, y_pred)
    print(f"Overall Accuracy: {accuracy:.2%}")
    
    # Top-3 accuracy (more relevant for our use case)
    y_pred_proba = classifier.predict_proba(X_test)
    top3_correct = 0
    
    for i, true_label in enumerate(y_test):
        # Get top 3 predictions
        top3_indices = np.argsort(y_pred_proba[i])[-3:][::-1]
        top3_classes = classifier.classes_[top3_indices]
        
        if true_label in top3_classes:
            top3_correct += 1
    
    top3_accuracy = top3_correct / len(y_test)
    print(f"Top-3 Accuracy: {top3_accuracy:.2%}")
    print(f"  (How often correct answer is in top 3 predictions)")
    
    # Detailed classification report
    print("\n" + "-"*80)
    print("DETAILED METRICS BY CLASS")
    print("-"*80 + "\n")
    
    # Get unique classes in test set
    unique_classes = sorted(set(y_test))
    target_names = [f"Issue {c}" for c in unique_classes]
    
    report = classification_report(
        y_test, y_pred, 
        labels=unique_classes,
        target_names=target_names,
        zero_division=0
    )
    print(report)
    
    return accuracy, top3_accuracy


def save_model(vectorizer, classifier, accuracy, top3_accuracy):
    """
    Save trained model to disk
    
    Args:
        vectorizer: Trained vectorizer
        classifier: Trained classifier
        accuracy: Model accuracy
        top3_accuracy: Top-3 accuracy
    """
    print("\n" + "="*80)
    print("SAVING MODEL")
    print("="*80 + "\n")
    
    # Create models directory
    os.makedirs("models", exist_ok=True)
    
    # Timestamp for versioning
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # Save vectorizer
    vectorizer_path = f"models/tfidf_vectorizer_{timestamp}.pkl"
    with open(vectorizer_path, 'wb') as f:
        pickle.dump(vectorizer, f)
    print(f"✅ Saved vectorizer: {vectorizer_path}")
    
    # Save classifier
    classifier_path = f"models/naive_bayes_classifier_{timestamp}.pkl"
    with open(classifier_path, 'wb') as f:
        pickle.dump(classifier, f)
    print(f"✅ Saved classifier: {classifier_path}")
    
    # Save as "latest" for easy loading
    with open("models/tfidf_vectorizer_latest.pkl", 'wb') as f:
        pickle.dump(vectorizer, f)
    with open("models/naive_bayes_classifier_latest.pkl", 'wb') as f:
        pickle.dump(classifier, f)
    print(f"✅ Saved as 'latest' versions")
    
    # Save metadata
    metadata = {
        "timestamp": timestamp,
        "accuracy": accuracy,
        "top3_accuracy": top3_accuracy,
        "vectorizer_file": vectorizer_path,
        "classifier_file": classifier_path
    }
    
    metadata_path = f"models/model_metadata_{timestamp}.txt"
    with open(metadata_path, 'w') as f:
        f.write("FieldSync Pro - AI Model Metadata\n")
        f.write("="*50 + "\n\n")
        for key, value in metadata.items():
            f.write(f"{key}: {value}\n")
    
    print(f"✅ Saved metadata: {metadata_path}")
    
    return vectorizer_path, classifier_path


def test_model(vectorizer, classifier):
    """
    Interactive testing of trained model
    
    Args:
        vectorizer: Trained vectorizer
        classifier: Trained classifier
    """
    print("\n" + "="*80)
    print("INTERACTIVE MODEL TESTING")
    print("="*80 + "\n")
    
    test_complaints = [
        "Water won't drain, clothes soaking wet",
        "Door keeps popping open during cycle",
        "Loud banging noise when spinning",
        "Washer won't turn on at all",
        "Detergent residue on clothes after wash"
    ]
    
    for complaint in test_complaints:
        # Preprocess
        complaint_clean = preprocess_text(complaint)
        
        # Vectorize
        complaint_tfidf = vectorizer.transform([complaint_clean])
        
        # Predict
        predicted_id = classifier.predict(complaint_tfidf)[0]
        probabilities = classifier.predict_proba(complaint_tfidf)[0]
        
        # Get top 3 predictions
        top3_indices = np.argsort(probabilities)[-3:][::-1]
        
        print(f"Complaint: \"{complaint}\"")
        print(f"Top 3 Predictions:")
        for i, idx in enumerate(top3_indices, 1):
            issue_id = classifier.classes_[idx]
            confidence = probabilities[idx]
            print(f"  {i}. Issue ID {issue_id} ({confidence:.1%} confidence)")
        print()


if __name__ == "__main__":
    print("\n" + "🤖 "*20)
    print("FieldSync Pro - AI Model Training")
    print("🤖 "*20)
    
    # Step 1: Fetch data
    complaints, issue_ids = fetch_training_data()
    
    # Step 2: Train model
    vectorizer, classifier, X_test, y_test = train_model(complaints, issue_ids)
    
    # Step 3: Evaluate
    accuracy, top3_accuracy = evaluate_model(classifier, X_test, y_test)
    
    # Step 4: Save model
    vectorizer_path, classifier_path = save_model(vectorizer, classifier, accuracy, top3_accuracy)
    
    # Step 5: Test interactively
    test_model(vectorizer, classifier)
    
    # Summary
    print("\n" + "="*80)
    print("✅ TRAINING COMPLETE")
    print("="*80)
    print(f"\nModel Performance:")
    print(f"  Accuracy: {accuracy:.2%}")
    print(f"  Top-3 Accuracy: {top3_accuracy:.2%}")
    print(f"\nModel Files:")
    print(f"  Vectorizer: {vectorizer_path}")
    print(f"  Classifier: {classifier_path}")
    print(f"\nNext Steps:")
    print(f"  1. Review accuracy metrics")
    print(f"  2. If accuracy < 70%, collect more training data")
    print(f"  3. If accuracy > 70%, integrate into /api/diagnose endpoint")
    print(f"  4. Compare AI model vs keyword matching")
    print()