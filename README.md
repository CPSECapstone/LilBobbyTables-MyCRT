### Status
[![Build Status](https://travis-ci.org/CPSECapstone/LilBobbyTables-MyCRT.svg?branch=master)](https://travis-ci.org/CPSECapstone/LilBobbyTables-MyCRT)

# LilBobbyTables-MyCRT
## (MySQL Capture and Replay Tool)

#### XKCD Name Inspiration
![Exploits Of A Mom](https://imgs.xkcd.com/comics/exploits_of_a_mom.png)

### User Guide

For usage and installation instructions, see the guide below.

[https://lilbobbytables.gitbook.io/mycrt-user-guide/](https://lilbobbytables.gitbook.io/mycrt-user-guide/)

### Dependencies

MyCRT uses a number of NPM dependencies, visit [the dependency graph](https://github.com/CPSECapstone/LilBobbyTables-MyCRT/network/dependencies) for a full list broken down by module.

### Background
> Amazon Web Services (AWS) has been the face of cloud computing and has provided a plethora of related resources to consumers and businesses since 2002. These resources include Relational Database Services (RDS) which allows customers to host a MySQL database in the cloud. This database is fully managed by AWS, thus abstracting the customer from maintaining scalability, administration, and security. Customers who are looking to modify their MySQL RDS server environment want to preemptively test workloads before committing to these changes - a capability that is currently missing in RDS. The ability to compare workloads on different servers would enable customers to seamlessly test MySQT environment changes without affecting their production database. Our project, MyCRT, aims to provide this functionality.

### Problem Description
> Many developers who manage their software through Amazon Web Services (AWS) would like a way to run and test their systems in an efficient and reliable manner. This includes making sure their database systems are running with the appropriate configurations and seeing how changes in their systems affect CPU workload and other metrics. While AWS provides the facilities to choose these systems through RDS, developers lack the ability to perform workload captures and replays as a testing mechanism to compare environments. Other cloud computing and database administration software offer this functionality, and MyCRT aims to bring it to AWS.

### Major Features
> MyCRT will bring three major features to AWS and RDS users. These features are workload capture, workload replay, and system metric display and comparison. Workload capture will allow users to record actions made to a source MySQL database along with a snapshot of its initial state and a collection of system metrics taken during the capture. Workload replay allows the users to replay these captured workloads on target database systems with different configurations. The same set of metrics is also recorded on the target systems. Finally, MyCRT will provide the metrics and interfaces to allow users to compare the metrics and choose the most efficient system configuration.

### Architecture Overview
##### Deployment Diagram
![deployment diagram](https://user-images.githubusercontent.com/9324880/33972167-58c08d68-e031-11e7-8113-39390eddff8d.png)
> To better understand the architecture of MyCRT, please visit the [architecture overview](https://github.com/CPSECapstone/LilBobbyTables-MyCRT/wiki/Architecture-Overview)
.


