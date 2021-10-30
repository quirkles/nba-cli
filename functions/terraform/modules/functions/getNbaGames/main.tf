# Create Cloud Function
resource "google_cloudfunctions_function" "function" {
  name    = var.function_name
  runtime = "nodejs14" # Switch to a different runtime if needed

  available_memory_mb   = 128
  source_archive_bucket = var.functions_bucket_name
  source_archive_object = var.functions_zipfile_name
  entry_point           = var.function_entry_point
  trigger_http = true
}

# Create IAM entry so all users can invoke the function
resource "google_cloudfunctions_function_iam_member" "invoker" {
  project        = google_cloudfunctions_function.function.project
  region         = google_cloudfunctions_function.function.region
  cloud_function = google_cloudfunctions_function.function.name

  role   = "roles/cloudfunctions.invoker"
  member = "allUsers"
}
