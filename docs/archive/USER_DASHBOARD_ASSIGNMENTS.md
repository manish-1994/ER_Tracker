# User Dashboard Assignments

This document outlines the security rules and configuration parameters mapping users to custom dashboards.

##MAPPING SYSTEM
- Admins can assign user dashboard views under the Dashboard Builder page.
- Select User -> Select Assigned Workbook -> Select Sheet -> Select Widget Type -> Save assignment.
- Stored as a configuration mapping of User ID to dashboard configurations.

##Access Enforcement
- On login, a user's dashboard view is dynamically loaded based on their user ID configuration mappings.
- If a user has an assigned custom dashboard:
  - The default Operations Control Center is hidden.
  - The user is immediately presented with their custom layout containing only the widgets they are authorized to view.
- If no custom dashboard is assigned, the user defaults to the standard Operations Control Center layout containing general database statistics.
- Direct access rules block unauthorized page routes.
