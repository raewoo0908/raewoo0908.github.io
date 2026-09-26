---
title: Curriculum Vitae
description: CV of an aspiring backend / cloud / AI engineer.
draft: false
---
# Raewoo Kang

**Backend / Cloud Infrastructure / AI Engineer**

:github:[https://github.com/raewoo0908](https://github.com/raewoo0908)

📨 [raewoo0908@gmail.com](mailto:raewoo0908@gmail.com)

 

:linkedin:[RaewooKang](https://www.linkedin.com/in/raewoo-kang-64a51a348/)

## Tech Stack


| Area                           | Tech Stack                                                        |
| ------------------------------ | ----------------------------------------------------------------- |
| **Languages**                  | `Java`, `Python`                                                  |
| **Frameworks &amp; Libraries** | `Spring Boot`, `PyTorch`                                          |
| **Cloud &amp; DevOps**         | `AWS`, `Microsoft Azure`, `Docker`, `DockerHub`, `GitHub Actions` |
| **Tools &amp; Collaboration**  | `Git`, `GitHub`, `Notion`, `Jira`                                 |
| **AI**                         | `Claude Code`                                                     |


## Education

- **Hanyang University (Ansan, South Korea)** — B.S. in Computer Science %% Mar 2020 – Feb 2027 (expected)
  - Senior year (7 of 8 semesters completed)
  - GPA 4.28 / 4.5
  - Relevant coursework: Data Structures, Databases, Operating Systems, Computer Networks, Deep Learning, Object-Oriented Software Development, Cloud Application Software Development, Cloud Infrastructure Management
- **Anyang Foreign Language High School (Anyang, South Korea)** — Chinese Language %% Mar 2017 – Feb 2020
  - Intensive English and Chinese language education

## Experience &amp; Activities

- **Codeit** - Codeit AI Engineer Bootcamp, Cohort 15 %% Sep 2026 – Mar 2027
- **Backend Team Lead** — Capstone: Blockchain-integrated fitness platform %% Jul 2025 – Jun 2026
- **President** — Student startup club, Hanyang University %% Sep 2025 – Jan 2026
- **Team Lead** — Capstone: MITRE ATT&amp;CK-based Purple Teaming framework %% Apr 2025 – Jun 2025
- **Undergraduate Intern** — Critical System Lab (CSL), Hanyang University; research and lab operations support %% Dec 2024 – Jun 2025
- **International Student Mentor** — 'Hanmille' mentoring program, Hanyang University %% Aug 2025 – Dec 2025
- **Military Service** — Completed full term of service as a military driver, Second Operations Command, Daegu, South Korea %% Sep 2021 – Mar 2023

## Projects

### **📸** Catch the Memory: Online Four-Cut Photo Booth Platform %% Sep 2026 – Present



**📌 Description**

Catch the Memory is a platform that offers a four-cut photo booth experience online. It focuses on faithfully carrying over the experience of taking photos with friends in an offline photo booth.


| Problem                                                                                                                          | Catch the Memory's Solution                                                                                      |
| -------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| You need a photo to certify a study session, but **a plain screenshot of a video-call screen is no fun.**                        | Offers a fun **four-cut photo shoot experience** with the shooting date shown.                                   |
| You want to **remember the moment a project wrapped up**, but there's no way to do it.                                           | Delivers fun four-cut photos with **playful accessories like sunglasses and party hats, plus character frames**. |
| You want to make **special memories** with the peers and teammates you met at a bootcamp, but **distance** is a real constraint. | Provides an **online photo booth** where you can meet in real time, free from distance constraints.              |


**💪 What Did I do**

- **Service Planning**
  - As a solo project, handled everything: problem definition, target user definition, user stories, functional/non-functional requirements, and wireframes.

  
- **Architecture Decisions**
  - Listed several candidate stacks capable of implementing the plan, and made heavy use of AI to **benchmark every feasible combination on both the browser and the server**, selecting the optimal tech stack that meets the non-functional requirements.
  - Chose the segmentation/face-tracking framework, processing resolution, real-time communication stack per purpose, P2P topology, and even AWS instance specs **based on experiments**.



**🔋 Tech Stack**

WebRTC, WebSocket, MediaPipe, React, Node.js, Fastify, AWS, SQLite, Docker, Github Actions



### **🏋🏻‍♂️** Momzzang Token: Blockchain-Integrated Fitness Platform %% Jul 2025 – Jun 2026

:github: [Momzzang-Seven/MZTK-BE](https://github.com/Momzzang-Seven/MZTK-BE)

**📌 Description**

Momzzang Token is a fitness community platform that delivers **an experience where your workouts become assets**.


| Problem                                                                         | Momzzang Token's Solution                                                                                                                                   |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Many people resolve to work out but can't keep it up and **give up midway**.    | Keeps workouts going **like a game** through attendance check-ins, XP, levels, and leaderboards.                                                            |
| Long-term motivation is lacking due to things like **a weak reward structure**. | Provides **blockchain token rewards**. Rather than tokens alone, they connect to real spending options such as one-day classes to **deliver real utility**. |
| Blockchain-based services have **a high barrier to entry**.                     | Lowers the Web3 barrier by **sponsoring gas fees**.                                                                                                         |


**💪 What Did I do**

- **Load Testing &amp; Performance Engineering** 
  - Generated load with k6 and measured it with Prometheus, Micrometer, and Zipkin.
  - **Transaction Scope Optimization**: Doubling the HikariCP pool (10→20) barely moved throughput, confirming the bottleneck wasn't the database. Zipkin tracing revealed nested `@Transactional(REQUIRES_NEW)` calls holding two DB connections per write request; adjusted the transaction scope and refactored it into an outbox pattern. 
  - **Eliminated concurrent connection holding (69%→0%), cut p99 latency \~69% (453ms→139ms), and tripled throughput without an RDS upgrade.**
- **CI/CD Pipeline Architecture**
  - Designed and built a pipeline based on GitHub Actions for CI and GitHub Secrets, Docker, Docker Hub, and AWS.
- **Engineering Process Optimization**
  - Within a Hexagonal Architecture, mandated UML sequence diagrams for use case design and introduced a peer-review system to prevent conflicts
  - Drastically reduced PR review times and merge conflicts.
- **Agile Team Leadership**
  - Led a 6-member team and built a collaboration system on a Notion workspace. 
  - Used Jira to break work down into Epics, Stories, and Tasks for task distribution and progress tracking.
- **Product Planning &amp; UX Design**
  - Identified key user pain points from a user-centric perspective and systematically documented requirements in spreadsheets.

**🔋 Tech Stack**

Java, Spring Boot, AWS, Docker, GitHub Actions, PostgreSQL

## Experience

### 📈 ReluSoft: On-Campus Startup Club %% Sep 2025 – Jan 2026

**📌 Description**

As someone who loves weight training, I was dealing with musculoskeletal imbalances and chronic pain. I once injured my back in the military so badly that I could barely walk. After my discharge, I searched around and found a trainer, with whom I did more than a year of rehab and strengthening work, fully regaining function to the point of running and squatting over 100kg. Many of my friends complained of the same discomfort, and I realized that many people want to understand their own movement accurately — so I founded an on-campus startup club around the idea of **a sports analytics solution that performs biomechanical analysis based on markerless motion capture**. 

**💪 What did I do**

- **Entered on- and off-campus startup IR pitching competitions**
  - Designed an architecture with the [OpenCap project](https://github.com/opencap-org), led by Stanford University's Human Performance Lab, as its core engine.
  - Conducted competitor analysis, BM development, market sizing, and revenue, cost, and investment projections.
  - Entered the Haedong Startup Competition and the National University Student SW Startup Ideathon and delivered IR pitches. [\[Slides\]](https://drive.google.com/file/d/1RQt0L9SdIht8LjeI1GzdNKp3p7exQ9zs/view)



### **🌐** Hanmille: International Student Mentor %% Aug 2025 – Dec 2025

**📌 Description**

Hanmille is a program run by the Office of International Affairs at Hanyang University ERICA that helps international students adjust to life in Korea. 

**💪 What did I do**

- **Planned and ran activities**
  - Seoul International Fireworks Festival (Yeouido): Watched the festival in Yeouido with exchange students from the US, Ireland, and France, and introduced traditional Korean dishes such as jokbal and sundae-gukbap as part of cultural exchange.
  - Exam-season study mate: Studied together at the library with a French exchange student and showed them around campus facilities.
  - Everyday life together: Worked out with a French exchange student at the campus gym and shared chicken in the dorm for cultural exchange.

## Awards

- **Excellence Award (3rd Place)** — Software Capstone Design Fair %% Jun 2026
  - Recognized for a blockchain-token-reward fitness community platform and excellence in load testing and performance engineering.
- **Grand Prize (1st Place)** — Top Academic Excellence Award %% Jan 2026
  - Highest average GPA across both semesters of the academic year; sole recipient in the entire department.
- **Excellence Award (3rd Place)** — National University Student SW Startup Ideathon %% Nov 2025
  - Proposed a mobile-based markerless motion-capture biomechanics analysis solution.

## Languages

- **English** — Upper-intermediate (TOEFL 90)
- **Korean** — Native

## Contact

:github:[raewoo0908](https://github.com/raewoo0908)

📨 [raewoo0908@gmail.com](mailto:raewoo0908@gmail.com)

:linkedin:[RaewooKang](https://www.linkedin.com/in/raewoo-kang-64a51a348/)