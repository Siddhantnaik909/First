# [Academic Report] Smart Hub: System Design & Documentation

This document provides a comprehensive technical breakdown of the **Smart Hub** project architecture. It is structured for inclusion in a final year "Black Book" project report, adhering to standard software engineering documentation practices.

---

## 1. Software Development Life Cycle (SDLC)
![SDLC Diagram](file:///C:/Users/hp/.gemini/antigravity/brain/2cb941f4-8d2c-40e9-a6d8-1d61459c3741/sdlc_diagram_1776624402569.png)

### Description
The SDLC diagram illustrates the systematic process adopted for the development of Smart Hub. We employed an **Iterative/Agile-inspired methodology** to ensure continuous feedback and quality control.

### Explanation
*   **Planning**: Defining project objectives (50+ tools, multiplayer games) and feasibility.
*   **Analysis**: Gathering requirements for various calculation formulas and PWA offline capabilities.
*   **Design**: Designing the system architecture, UI/UX (using the "Olive Structured Dark" theme), and database schemas.
*   **Development**: Writing the core logic using Node.js, Express, and vanilla JavaScript.
*   **Testing**: Performing unit tests on calculation engines and stress-testing WebSocket connections.
*   **Deployment**: Hosting the application on cloud platforms with CI/CD integration.
*   **Maintenance**: Resolving bugs and updating calculator catalogs based on user feedback.

---

## 2. Data Flow Diagram (DFD) Level 0
![DFD Level 0](file:///C:/Users/hp/.gemini/antigravity/brain/2cb941f4-8d2c-40e9-a6d8-1d61459c3741/dfd_level_0_1776624418245.png)

### Description
The Context Diagram (Level 0) represents the entire Smart Hub system as a single process. It defines the external boundaries and basic interactions between the system and its users.

### Explanation
*   **System Boundary**: The central circle represents the "Smart Hub System."
*   **External Entities**: 
    *   **User**: Interacts with the system to perform calculations and play games.
    *   **Administrator**: Interacts with the system to manage users and monitor analytics.
*   **Data Flow**: Shows high-level inputs (Credentials, Calculation Parameters) and outputs (Results, Analytics Reports).

---

## 3. Data Flow Diagram (DFD) Level 1
![DFD Level 1](file:///C:/Users/hp/.gemini/antigravity/brain/2cb941f4-8d2c-40e9-a6d8-1d61459c3741/dfd_level_1_1776624435296.png)

### Description
DFD Level 1 decomposes the context diagram into sub-processes, showing how data is routed to specific services and where it is stored.

### Explanation
*   **Sub-Processes**: 
    *   **1.0 Authentication**: Validating JWT tokens and handling logins.
    *   **2.0 Tool Engine**: Processing mathematical formulas for the 50+ calculators.
    *   **3.0 Game Management**: Handling real-time WebSocket traffic for multiplayer lobbies.
    *   **4.0 History Tracking**: Managing the persistence of user calculation records.
*   **Data Stores**: The diagram shows read/write operations to the **MongoDB** collections (Users, Tools, History).

---

## 4. System Architecture Diagram
![System Architecture Diagram](file:///C:/Users/hp/.gemini/antigravity/brain/2cb941f4-8d2c-40e9-a6d8-1d61459c3741/system_architecture_1776624453587.png)

### Description
This diagram describes the physical structure of the application, organized into three distinct tiers: Presentation, Logic, and Data.

### Explanation
*   **Frontend (PWA Layer)**: Built with HTML5, CSS3 (Tailwind), and JS. It uses Service Workers for offline functionality.
*   **Backend (API Layer)**: An Express.js server that handles RESTful requests and a Socket.io server for real-time communication.
*   **Database (Data Layer)**: A MongoDB NoSQL database used for high-availability storage of flexible document structures.

---

## 5. Use Case Diagram
![Use Case Diagram](file:///C:/Users/hp/.gemini/antigravity/brain/2cb941f4-8d2c-40e9-a6d8-1d61459c3741/use_case_diagram_1776624471350.png)

### Description
The Use Case diagram outlines the functional requirements of the system by identifying the interactions between actors (User/Admin) and specific use cases.

### Explanation
*   **User Actions**: Includes calculating results, viewing history, and joining multiplayer games.
*   **Admin Actions**: Includes managing user databases and viewing system-wide audit logs.
*   **System Boundary**: Encapsulates the core features that differentiate the SaaS capabilities from standard utility tools.

---

## 6. Class Diagram
![Class Diagram](file:///C:/Users/hp/.gemini/antigravity/brain/2cb941f4-8d2c-40e9-a6d8-1d61459c3741/class_diagram_1776624489982.png)

### Description
A UML Class Diagram representing the object-oriented structure of the project. It shows the static relationships between various entities in the backend.

### Explanation
*   **Classes**:
    *   `User`: Handles profile and authentication data.
    *   `Calculator`: Defines metadata and logic for individual tools.
    *   `HistoryRecord`: Bridges Users and Calculators to track usage.
    *   `GameSession`: Manages the state and players in a lobby.
*   **Relationships**: Associations (1-to-Many) between Users and their Calculation History are clearly defined.

---

## 7. Sequence Diagram
![Sequence Diagram](file:///C:/Users/hp/.gemini/antigravity/brain/2cb941f4-8d2c-40e9-a6d8-1d61459c3741/sequence_diagram_1776624514255.png)

### Description
This diagram visualizes the time-ordered flow of a key operation: **Processing a Tool Calculation and Saving History.**

### Explanation
1.  **Actor (User)**: Submits inputs via the PWA UI.
2.  **Frontend**: Triggers a POST request to the API.
3.  **Backend API**: Validates the session and computes the result.
4.  **Database (MongoDB)**: Saves the record for later retrieval.
5.  **Return Path**: The success response flows back to the UI, which updates the view for the user.
