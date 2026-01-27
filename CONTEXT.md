Behavior Context: Internal Vehicle Management System (VMS)
1. Actors (User Roles)
Driver / Staff: (e.g., User ID 01426, 01305) The primary user who operates the vehicle, logs odometer readings, records fuel expenses, and updates trip status on-site.

Admin / Dispatcher: (Implied) The user responsible for monitoring fleet availability, reviewing logs, and exporting data for accounting or auditing purposes.

2. Core Behaviors & User Journey
These are the specific contexts identified from the application flow:

A. Authentication Context

Behavior: Users must authenticate to access the system. The system captures the User ID and Name to attribute all subsequent actions (trip logs, fuel records) to a specific individual.

Data Points: Username, Password, Employee ID.

B. Fleet Status Context

Behavior:

Users can search for vehicles by license plate.

The system displays real-time status:

🟡 In Use: Vehicle is currently on a mission.

🟣 Stand By: Vehicle is parked and available.

Goal: To provide immediate visibility on which vehicles are free and which are occupied.

C. Trip Management Context

Behavior: The core cycle of the application. Users must log the start and end of a journey.

Process Flow:

Open Odometer (Start Trip): Input current mileage, origin, destination, and job description.

Close Odometer (End Trip): Input final mileage upon return to calculate total distance.

Data Inputs: License Plate, Date, Job Description, Route (Origin/Destination), Odometer (Start/End), Driver Name.

D. Fuel & Expense Context

Behavior: If refueling occurs during a trip, it is treated as a sub-transaction within that active trip.

Data Inputs:

Odometer at refill station.

Station Name (e.g., PTT).

Province.

Financial Data: Price (THB) and Volume (Liters). Crucial for calculating Fuel Consumption Rate (km/L).

E. Reporting & History Context

Behavior: The system aggregates all historical data (Trips + Fuel) and allows users to filter by date range or specific project.

Output: Data can be exported to Excel for external processing (budgeting/auditing).

3. Scenario Examples (for Testing/Development)
You can use these scenarios to write your User Stories or BDD (Behavior-Driven Development) tests:

Scenario 1: Starting a New Assignment

Given the driver is logged in and Vehicle "6ชส-8709" is status "Stand By". When the driver selects "Edit/Use", enters the "Start Odometer" reading (e.g., 13,536), and saves. Then the vehicle status updates to "In Use". And a new Trip Record is created with a "Started" timestamp.

Scenario 2: Refueling Mid-Trip

Given Vehicle "6ชส-8709" is currently "In Use". When the driver selects "Add Fuel Info", inputs the cost (1,000 THB) and volume (30 Liters). Then the system saves a Fuel Log entry associated with the current active Trip ID.

4. Design & Planning Recommendations
To ensure this project scales well, I recommend focusing on these technical aspects next:

Database Relationships (One-to-Many):

Ensure your database separates Trips from Fuel_Logs.

Structure: 1 Trip ID can have many Fuel Log entries (in case they fill up twice on a long journey).

Data Validation:

Odometer Logic: The system must prevent users from entering a "Start Odometer" that is lower than the vehicle's last known "End Odometer." This prevents data gaps.

Status Logic:

Ensure a vehicle cannot be "Started" by User B if User A hasn't "Closed" the previous trip yet.