variable "project" {}
variable "function_name" {
  default = "get_nba_games"
}
variable "function_entry_point" {
  default = "main"
}
variable "functions_bucket_name" {}
variable "functions_zipfile_name" {}
