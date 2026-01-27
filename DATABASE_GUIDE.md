# Database Backup and Restore Guide

This guide explains how to perform database backup and restore operations in the Car Usage Management System.

## Overview
The system uses a **SQLite** database (`dev.db`). The Admin Dashboard provides tools to download a snapshot of this database and restore it if necessary.

**Location**: Admin Dashboard > Database Management Section (bottom of page)

---

## 1. How to Backup Data
Regular backups are recommended to prevent data loss.

1.  Log in to the application as an **Administrator**.
2.  Navigate to the **Admin Dashboard** (`/admin`).
3.  Scroll down to the **Database Management** section.
4.  Click the **"Download Backup"** button.
5.  A file named `backup-YYYY-MM-DD.sqlite` will be downloaded to your computer.
    *   *Store this file in a secure location.*

---

## 2. How to Restore Data
Restoring data allows you to revert the system to a previous state using a backup file.

> [!WARNING]
> **CRITICAL WARNING**: Restoring a database acts as a **complete overwrite**.
> *   All current data (Users, Trips, Vehicles, etc.) created *after* the backup was taken will be **permanently lost**.
> *   The system will revert exactly to the state it was in when the backup file was created.

### Steps to Restore:
1.  Log in to the application as an **Administrator**.
2.  Navigate to the **Admin Dashboard** (`/admin`).
3.  Scroll down to the **Database Management** section.
4.  Click the **"Restore Backup"** button (red button).
5.  A file selection dialog will appear. Select your `.sqlite` or `.db` backup file.
6.  A **Confirmation Dialog** will appear warning you about the data overwrite.
7.  Read the warning carefully. If you are sure, click **"Overwrite & Restore"**.
8.  The system will process the file. Upon success, the page will automatically reload to show the restored data.

### Troubleshooting
*   **"Invalid file type"**: Ensure you are uploading a valid SQLite file with `.db` or `.sqlite` extension.
*   **Errors during restore**: Check the server logs if the restore fails. Ensure the file is not corrupted.

---

## Technical Details (for Developers)
*   **Database Path**: `prisma/dev.db`
*   **API Routes**:
    *   `GET /api/admin/backup`: Streams the file for download.
    *   `POST /api/admin/backup`: Accepts multipart form upload and overwrites `prisma/dev.db`.

---

## 3. Managing Database Schema (Updating App Version)
When deploying a new version of the app that includes changes to the database structure (e.g., new tables or columns), you need to update the database schema.

**Steps:**
1.  **Backup Data**: Always download a backup before performing any schema updates (see Section 1).
2.  **Open Terminal**: Navigate to the project root directory.
3.  **Run Command**:
    ```bash
    npx prisma db push
    ```
4.  **Verify**: The command output should confirm that the database is now in sync with the Prisma schema.
    *   *Note*: If the change is destructive (e.g., deleting a column), the command will ask for confirmation.
5.  **Restart App**: Restart the application server to ensure all changes are loaded.
