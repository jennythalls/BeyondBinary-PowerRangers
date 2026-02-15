# 🌿 NTU Circles – NTU Community & Wellness Platform

## 🚀 Overview

NTU Circles is a secure, NTU-exclusive digital platform designed to strengthen student connection and mental wellbeing.

University students often face social isolation and academic burnout simultaneously. While social platforms exist, they lack safety controls and campus relevance. Mental health tools, on the other hand, are often detached from community interaction.

SafeSpace integrates:

- 🗺 **SideQuest** – Real-time, map-based social meetups  
- 🌿 **QuestBreak** – Structured mental wellness tools  

By combining verified identity, location-based discovery, and AI-assisted reflection, we create a safer and more connected NTU ecosystem.

---

# 🎯 Problem Statement

Students today:

- Struggle to find spontaneous and safe social interactions
- Feel unsafe meeting strangers online
- Experience stress, burnout, and sleep issues
- Lack structured tools to reflect and track emotional wellbeing

Our solution addresses both **community bonding and mental resilience** within one unified system.

---

# 🔐 Authentication & Security

- NTU email verification required
- User profile management (username, password)
- Dark mode support
- Gender-based colour indicators for enhanced safety awareness
- Secure handling of API keys (no exposed credentials)

---

# 🗺 SideQuest – Real-Time Campus Meetups

Built using **Google Maps JavaScript API** and **Geocoding API**.

### Core Features:

- Map / Satellite toggle
- Zoom in/out functionality
- Quest clustering when zoomed out
- Hover-to-preview quest details
- Category filtering
- Date & time filtering
- Real-time quest creation with automatic map plotting
- Multiple quests at the same location
- Join quest functionality
- “My Quests” dashboard (created + joined quests)
- Real-time chat system
- Read receipts & unread message indicators
- Manual or automatic quest expiry

SideQuest encourages low-pressure, spontaneous social engagement within a verified campus network.

---

# 🌿 QuestBreak – Mental Wellness Support

## ✨ AI-Generated Motivation

- 30 AI-generated motivational quotes daily
- Dynamically refreshed content

## 📝 Guided Reflection

Emotion-based prompts:
- Feeling stressed
- Study/work burnout
- Sleep issues

Features:
- Structured journaling prompts
- Save responses
- Monthly filtering of reflections
- Emotional trend tracking

Research indicates that structured journaling improves emotional clarity and stress regulation.

---

# 📞 Support Resources

Curated NTU and Singapore helplines categorized by:

- Academic stress
- Mental health crisis
- Personal relationship issues

Ensures students can quickly find the appropriate support channel.

---

# 🛠 Tech Stack

### Frontend
- React (or relevant framework)
- Google Maps JavaScript API
- Geocoding API

### Backend
- Authentication service
- Real-time database for chat & quest storage
- Secure environment variable configuration

### AI Integration
- AI-powered motivational quote generation
- Dynamic reflection prompts

---

# 🏗 System Architecture

User → Authentication →  
SideQuest (Maps + Database + Chat System)  
QuestBreak (AI Engine + Reflection Storage)

---

# 📂 Repository Structure
/src
/components
/pages
/utils
/public
README.md
package.json


---

# 🔒 Security Considerations

- NTU-only verified access
- No API keys stored client-side
- Secure database rules
- Quest auto-expiry to prevent outdated events
- Controlled chat access limited to quest participants

---

# 🚀 Future Improvements

- Push notifications
- AI-driven mood trend analytics
- Safety check-in system
- Moderation dashboard
- Anonymous quest option

---

# 👥 Team Members

- Darren Ang
- Hanson Tan
- Harihar Narayan
- Harshini YP
- Wayne Ong

---

# 🏆 Hackathon Submission

Built for: Beyond Binary
Challenge Theme: How can data-driven, community-centred technologies reduce isolation and foster meaningful social engagement?

---

[Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
