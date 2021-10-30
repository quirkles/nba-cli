locals {
  timestamp = formatdate("YYMMDDhhmmss", timestamp())
}

data "external" "ts_build" {
  program = ["bash", "-c", <<EOT
# Relative to working_dir
(pwd && npm ci && npm run build) >&2 && echo "{\"dest\": \"dist\"}"
EOT
  ]
  working_dir = "${path.root}/../"
}

data "external" "copy_package_json" {
  program = ["bash", "-c", <<EOT
# Relative to working_dir
(cp package.json ${data.external.ts_build.result.dest}) >&2 && echo "{\"dest\": \"dist\"}"
EOT
  ]
  working_dir = "${path.root}/../"
}
# Compress source code
data "archive_file" "source" {
  type        = "zip"
  source_dir  = "${data.external.ts_build.working_dir}${data.external.ts_build.result.dest}"
  output_path = "/tmp/function-${local.timestamp}.zip"
}
# Add source code zip to bucket
resource "google_storage_bucket_object" "zip" {
  # Append file MD5 to force bucket to be recreated
  name   = "source.zip#${data.archive_file.source.output_md5}"
  bucket = var.functions_bucket_name
  source = data.archive_file.source.output_path
}

# Enable Cloud Functions API
resource "google_project_service" "cf" {
  project = var.project
  service = "cloudfunctions.googleapis.com"

  disable_dependent_services = true
  disable_on_destroy         = false
}

# Enable Cloud Build API
resource "google_project_service" "cb" {
  project = var.project
  service = "cloudbuild.googleapis.com"

  disable_dependent_services = true
  disable_on_destroy         = false
}
