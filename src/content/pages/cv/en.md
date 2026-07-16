---
title: Curriculum Vitae
description: CV of Raewoo Kang, aspiring backend / cloud infrastructure engineer.
---

# Raewoo Kang (강래우)

**Aspiring Backend / Cloud Infrastructure Engineer**

Backed by hands-on Spring Boot and AWS backend experience, I aim to contribute to a mission-driven engineering organization.

## Highlights

- **Adaptable & Diligent** — A fast learner with a strong aptitude for foreign languages and new environments, committed to consistency and diligence.
- **Agile Collaboration** — Experienced in delivering software projects with Agile methodologies and collaboration tools such as Notion, Jira, and GitHub.
- **Strong CS Foundation** — Comprehensive knowledge across computer science, including Operating Systems, Computer Networks, Databases, Artificial Intelligence, and Object-Oriented Programming (OOP).
- **Global Mindset** — Built a solid foundation in English and Chinese at a foreign language high school, cultivating openness to diverse cultures.

## Tech Stack

- **Languages:** `Java`, `Python`, `C`
- **Frameworks & Libraries:** `Spring Boot`, `Flask`, `PyTorch`
- **Cloud & DevOps:** `AWS`, `Microsoft Azure`, `Docker`, `GitHub Actions`
- **Tools & Collaboration:** `Git`, `GitHub`, `Notion`, `Jira`

## Education

- **Hanyang University (Ansan, South Korea)** — B.S. in Computer Science · Mar 2020 – Feb 2027 (expected)
  - Senior year (7 of 8 semesters completed)
  - GPA 4.28 / 4.5
  - Relevant coursework: Data Structures, Databases, Design & Analysis of Algorithms, Operating Systems, Computer Networks, Advanced Databases, Deep Learning, Object-Oriented Software Development, Basics of Cryptocurrency & Blockchain, Cloud Application Software Development, Cloud Infrastructure Management
- **Anyang Foreign Language High School (Anyang, South Korea)** — Chinese Language · Mar 2017 – Feb 2020
  - Intensive English and Chinese language studies

## Experience & Activities

- **Backend Team Lead** — Capstone: Blockchain-integrated fitness platform · Jul 2025 – Jun 2026
- **President** — Student startup club, Hanyang University · Sep 2025 – Jan 2026
- **Team Lead** — Capstone: MITRE ATT&CK-based Purple Teaming framework · Apr 2025 – Jun 2025
- **Research Intern** — Critical System Lab (CSL), Hanyang University; research and lab operations support · Dec 2024 – Jun 2025
- **International Student Mentor** — 'Hanmille' mentoring program, Hanyang University · Aug 2025 – Dec 2025
- **Military Service** — Honorably discharged as a military driver, Daegu, South Korea · Sep 2021 – Mar 2023

## Projects

### Blockchain-Integrated Fitness Platform — Backend Team Lead

**Jul 2025 – Jun 2026** · Java · Spring Boot · AWS · Docker · GitHub Actions · PostgreSQL

GitHub: [Momzzang-Seven/MZTK-BE](https://github.com/Momzzang-Seven/MZTK-BE)

- **Performance Engineering & Load Testing** — Ran phased k6 load tests instrumented with Prometheus, Micrometer, and Zipkin. Doubling the HikariCP pool (10→20) barely moved throughput, proving the bottleneck wasn't the database. Zipkin tracing revealed a nested `@Transactional(REQUIRES_NEW)` call holding two DB connections per write request; refactored it into a non-transactional facade with a guaranteed outbox. **Eliminated concurrent connection holding (69%→0%), cut p99 latency ~69% (453ms→139ms), and tripled throughput without an RDS upgrade.**
- **CI/CD Pipeline Architecture** — Designed and deployed a robust pipeline using GitHub Actions for CI, and GitHub Secrets, Docker, Docker Hub, and AWS for seamless CD.
- **Engineering Process Optimization** — Within a Hexagonal Architecture, introduced a pre-coding approval system mandating UML sequence diagrams for use case planning, aligning the team's technical vision and drastically reducing PR review times and merge conflicts.
- **Agile Team Leadership** — Led a 6-member cross-functional team, establishing a centralized Notion workspace and integrating Jira to decompose goals into prioritized tickets, improving task distribution and progress tracking.
- **Product Planning & UX Design** — Identified key user pain points from a user-centric perspective and systematically documented requirements via shared spreadsheets.

### MITRE ATT&CK-Based Purple Teaming Framework — Team Lead

**Apr 2025 – Jun 2025** · Python · Sigma Rule · MITRE ATT&CK · Caldera · Elasticsearch · Kibana

GitHub: [raewoo0908/HyPurity](https://github.com/raewoo0908/HyPurity)

- **Automated Rule Generation** — Built a program that uses an LLM to generate Sigma rules mapped to the MITRE ATT&CK matrix, automating the creation of standardized threat detection signatures.
- **Backend Integration & Automation** — Designed "Sigma-Flow," a custom Python CLI tool that parses AI-generated security rules and deploys them to the Elastic Stack via API.
- **Purple Teaming Integration** — Built a comprehensive purple teaming environment bridging offensive testing (Caldera) with defensive monitoring, plus a custom real-time Discord webhook alerting system.

## Awards

- **First Place** — Academic Excellence Award · Jan 2026
  - Highest average GPA across both semesters of the academic year; sole recipient in the entire department.
- **Excellence Award (3rd Place)** — Software Capstone Design Fair · Jun 2026
  - Recognized for a blockchain-token-reward fitness community platform and excellence in load testing and performance engineering.
- **Excellence Award (3rd Place)** — National University Student SW Startup Ideathon · Nov 2025
  - Proposed a mobile-based markerless motion-capture biomechanics analysis solution.

## Languages

- **English** — Upper-intermediate (TOEFL 90)
- **Chinese** — Studied at a foreign language high school
- **Korean** — Native

## Contact

- Email: raewoo0908@gmail.com
- GitHub: [raewoo0908](https://github.com/raewoo0908)
- Portfolio: [Notion](https://app.notion.com/p/Raewoo-Kang-s-Portfolio-32a97c8cd42c8096b616d5ff86f3be03?source=copy_link)
- Location: Ansan, Gyeonggi-do, South Korea
