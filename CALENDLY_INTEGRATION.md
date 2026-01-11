# Calendly Integration - sovereigndesign.it.com Podcast

## Calendly Link
**URL:** https://calendly.com/maggie-maggieforbesstrategies/podcast-call-1

---

## Where It's Integrated

### 1. Homepage (`/`)
**Podcast Section:**
- New section highlighting sovereigndesign.it.com podcast
- Prominent "Schedule Podcast Discussion" button
- Links to partner application

**Navigation:**
- "Podcast" link in top nav → Goes directly to Calendly

**Footer:**
- "sovereigndesign.it.com Podcast" link

### 2. Partner Application (`/partners`)
**Benefits Section:**
- "Schedule a podcast discussion →" link under Podcast Platform card

**Success Page:**
- If applicant checked "podcast interest", they see:
  - **"Schedule Your Podcast Call Now"** button (gold, prominent)
  - Opens Calendly in new tab
- If no podcast interest, only "Return Home" button shows

### 3. Email Templates (`PARTNERSHIP_OUTREACH_SYSTEM.md`)
**Template 2: Podcast Invitation**
- Includes Calendly link for easy scheduling
- "If you're interested, you can schedule a time to discuss at your convenience:"
- Direct link provided

---

## User Journey

### For Lawyers Interested in Podcast:

**Path 1: Direct from Homepage**
```
https://introalignment.com → Click "Podcast" in nav → Calendly opens → Schedule call
```

**Path 2: Via Partner Application**
```
https://introalignment.com → "Partner With Us" → Fill application → Check podcast interest
→ Submit → See "Schedule Your Podcast Call Now" → Calendly opens
```

**Path 3: Email Outreach**
```
Receive podcast invitation email → Click Calendly link → Schedule call
```

### For Site Visitors:
```
https://introalignment.com → Scroll to Podcast section → "Schedule Podcast Discussion"
→ Calendly opens → Book time with Maggie
```

---

## Calendly Settings Recommendations

### Event Details:
- **Event Name:** "sovereigndesign.it.com Podcast Discussion"
- **Duration:** 30-45 minutes
- **Location:** Zoom/Google Meet (automated link)
- **Availability:** Wednesdays (Legal professionals and attorneys)

### Questions to Ask Invitees:
1. "What is your area of legal expertise?"
2. "What topics would you like to discuss on the podcast?"
3. "Please share your website/LinkedIn profile"
4. "Any specific cases or achievements you'd like to highlight?"

### Confirmation Message:
```
Thank you for scheduling your Wednesday podcast discussion for sovereigndesign.it.com!

We're excited to discuss your expertise in [Topic] and how you help
high-net-worth families build generational wealth.

Your session is scheduled for Wednesday. Before our call, please prepare:
- 2-3 topics you'd like to discuss
- Any notable cases or achievements to share
- Your preferred recording platform (Zoom/StreamYard)

Looking forward to connecting!

Best,
Maggie Forbes
IntroAlignment
```

---

## Analytics to Track

### Calendly Metrics:
- Total bookings from website
- Conversion rate (partner applications → podcast bookings)
- No-show rate
- Most popular time slots

### Website Metrics:
- Clicks on "Podcast" nav link
- Clicks on "Schedule Podcast Discussion" button
- Partner applications with podcast interest checked
- Post-application Calendly bookings

---

## Next Steps

1. ✅ Test Calendly link from all locations
2. ⏳ Customize Calendly event page with IntroAlignment branding
3. ⏳ Set up email reminders (24 hours before, 1 hour before)
4. ⏳ Create post-call workflow:
   - Send thank you email
   - Schedule recording session
   - Add to podcast_episodes table
5. ⏳ Track bookings in admin panel

---

## Technical Implementation

### Button Styling:
```tsx
<a
  href="https://calendly.com/maggie-maggieforbesstrategies/podcast-call-1"
  target="_blank"
  rel="noopener noreferrer"
  className="bg-gold hover:bg-gold-light text-obsidian font-ui font-semibold px-10 py-4 rounded-lg"
>
  Schedule Podcast Discussion
</a>
```

### Opens in new tab (`target="_blank"`)
### Security: `rel="noopener noreferrer"`

---

**Your Calendly link is now integrated across the entire IntroAlignment system for easy podcast guest scheduling!** 🎙️
