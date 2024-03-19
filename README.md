# task-runner
Task Runner provides a robust and versatile framework for managing and executing tasks. It serves as a foundational tool for applications requiring sophisticated task scheduling, execution, and lifecycle management. The library's primary feature is the **TaskRunner** class, which orchestrates task execution and interacts seamlessly with various components like **TaskFactory**, **Task**, and others, ensuring a smooth and efficient task management process.

### MongoDB Persistence
One of the standout features of Task Runner is its integration with MongoDB through Mongoose, offering reliable and scalable persistence for task data. This integration allows tasks to be stored, retrieved, and managed effectively, ensuring data consistency and durability across application restarts or crashes. By leveraging Mongoose schemas and models, Task Runner ensures that task data conforms to predefined structures, providing a solid and predictable foundation for task management.

### Real-time Task Execution Monitoring
Task Runner also excels in providing real-time information about task execution through socket.io. This feature enables live monitoring and interaction with running tasks, allowing systems to react dynamically to task progress, completion, or failure. By utilizing websockets, Task Runner offers a real-time communication channel between the server and clients, ensuring that task status updates are delivered instantaneously, fostering a responsive and interactive user experience.

### Real-time Task Execution Monitoring in Distributed Environments
Task Runner is uniquely designed for environments where multiple servers may be responsible for executing tasks. This design consideration becomes crucial in scenarios where a task might be executed on a different machine than the one currently being monitored. To address this challenge, the TaskRunner class offers a sophisticated websocket interface. This interface leverages the technology of real-time MongoDB queries developed in [WINKgroup's db-mongo project](https://github.com/WINKgroup/db-mongo), ensuring that any changes in task status are efficiently communicated across distributed systems.

### Distributed Task Management with Real-time MongoDB Queries
The real-time query feature for MongoDB is pivotal in environments with multiple task-executing servers. When a task's state changes (for instance, when the "worker" attribute on the Task model is updated), this change triggers a real-time event in the database. This event is then propagated through the Task Runner's websocket interface to all subscribed clients. This mechanism is particularly important because a server might not be directly handling a task, but another machine could be processing it. Thanks to the real-time query capabilities on MongoDB, every change in the database—like the task being assigned to a worker—is instantly communicated to the relevant servers.

### Dynamic Client-Server Interaction with Websockets
The **TaskRunner** class allows clients to subscribe to task state changes using the "subscribeQuery" websocket message. Among the updates made to a task in the database when it's taken up for processing is the "publicUrl" attribute. This attribute is crucial for web clients; it points them to the specific websocket address of the task (not just the task runner), which can provide detailed information about the task's state.

### Practical Example: Managing Large File Downloads
Consider a system designed to download large files, where each download is represented as a Task. Suppose there are multiple hosts capable of performing these downloads. A web client can open a websocket connection to one of these hosts to get a list of downloads and their general status (e.g., pending, completed, downloading, download error, etc.). However, if a file's status is "downloading," the client would need to connect to another websocket at the "publicUrl" specified in the Task's information. This connection would provide real-time data on the download progress, such as the amount of data downloaded so far.

This dual-layer websocket approach—general status monitoring through the Task Runner and detailed task-specific updates through individual task websockets—ensures a comprehensive and real-time monitoring and management of tasks in a distributed environment. It highlights Task Runner's capability to handle complex, distributed task execution scenarios efficiently, making it an ideal choice for systems requiring high levels of coordination and real-time data dissemination across multiple servers.


## Installation
```sh
npm install @winkgroup/task-runner
```

or

```sh
yarn add @winkgroup/task-runner
```

## Usage


## Comparison
The Task Runner approach, leveraging MongoDB's real-time queries and websocket connections for task management and monitoring, offers several advantages and disadvantages, especially when compared to traditional publish/subscribe (pub/sub) systems. Here's a detailed breakdown:

### Advantages
1. Database Integration:
  - Data Consistency: Direct use of real-time database queries ensures that any change in the database is immediately reflected in the task system, ensuring high data consistency between the database state and the perceived application state.
  - Reduced Complexity: Integrating directly with the database eliminates the need to manage an additional pub/sub layer for task state synchronization.
2. Detailed and Real-time Monitoring:
  - Direct Interaction with Tasks: The ability to open direct websocket connections to specific tasks (via "publicUrl") allows for granular, real-time monitoring and control of tasks, particularly beneficial for complex or long-running tasks.
3. Scalability in Distributed Environments:
  - Operational Flexibility: The approach is well-suited for distributed systems where tasks can be executed on different servers. The distributed nature of real-time queries and websockets facilitates easy scalability and load balancing across multiple nodes.

### Disadvantages
1. Lower Throughput:
  - Communication Overhead: Every task state change can generate network traffic due to real-time notifications and websocket communications. In systems with a high volume of tasks or frequent state changes, this can lead to lower throughput compared to pub/sub systems optimized for such scenarios.
2. Dependence on Specific Technologies:
  - Tight Coupling with MongoDB and Websockets: While the tight integration with MongoDB and the use of websockets offer advantages in terms of real-time updates and data consistency, this can also be viewed as a limitation, as it ties the system to specific technologies and might complicate integration with other platforms or the adoption of different databases or communication mechanisms.
3. Concurrency and Complexity Management:
  - State and Concurrency Management: Managing the state of tasks and concurrency among different nodes executing tasks can become complex, especially in highly distributed systems. While real-time queries provide immediate updates, ensuring that actions are correctly coordinated and sequential may require additional logic.

### Comparison with Pub/Sub Systems
Traditional Pub/Sub systems are generally designed to handle high throughput and are optimized for the rapid and scalable dissemination of messages. However, they may not offer the same level of direct database integration or the same granularity in task monitoring and control.

In conclusion, the choice between the Task Runner approach and a traditional Pub/Sub system will depend on the specific needs of the application, particularly in terms of data consistency, real-time monitoring needs, required throughput, and architectural preferences.


## Placeholder for future use
https://github.com/crcn/sift.js


## Maintainers
* [fairsayan](https://github.com/fairsayan)