# Create bucket that will host the source code
resource "google_storage_bucket" "bucket" {
  name = var.bucket_name
}
