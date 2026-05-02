# Ethics Framework v1.0
## Perceptual & Cognitive Mapping System (Research-Grade)

## Overview

The Perceptual & Cognitive Mapping System (PCMS) v1.0 is designed as a **research-grade adaptive assessment platform** for understanding cognitive diversity while maintaining the highest ethical standards. This document outlines our comprehensive ethical framework, addressing privacy, consent, data protection, and responsible use.

## Critical Non-Diagnostic Clarification

### NOT A MEDICAL OR CLINICAL TOOL
- **Research Purpose Only**: PCMS is designed for scientific research and self-understanding
- **No Diagnostic Claims**: The system does not diagnose, treat, or assess medical conditions
- **No Clinical Recommendations**: Results are not medical advice and should not replace professional healthcare
- **Label-Free Approach**: Uses dimensional modeling rather than categorical labels or diagnoses

### Appropriate Use Cases
- **Self-Understanding**: Personal insight into cognitive patterns and preferences
- **Research**: Scientific study of cognitive diversity and dimensional approaches
- **Educational**: Understanding different cognitive styles and approaches
- **Personal Development**: Identifying optimal environments and strategies

### Inappropriate Use Cases
- **Medical Diagnosis**: Cannot be used for diagnosing ADHD, autism, or other conditions
- **Clinical Decision Making**: Not suitable for treatment planning or medical decisions
- **Employment Screening**: Not designed for hiring or employment decisions
- **Educational Placement**: Not appropriate for special education eligibility, streaming, or high-stakes tracking

## Non-Gatekeeping Guarantee

PCMS results:
- **Do not** affect eligibility for any formal diagnostic assessment
- **Do not** serve as evidence for or against any clinical determination
- **Do not** replace any occupational, educational, or healthcare assessment
- **Are not** designed to be shown to institutions as evidence of cognitive traits

If any deployment of PCMS is found to be used as a gatekeeper to clinical assessment, that deployment violates the terms of this project's ethical guidelines and (if research data is collected) must be reported to the relevant IRB/ethics board.

Any fork or derivative of PCMS that uses results to influence access to services must remove PCMS branding and clearly distinguish its use case.

### Classroom, youth, and international deployment

- **Default product consent** in this repository assumes **adult** participants unless your fork changes it. Use with **children or adolescents** (for example a middle-school class) requires **institutional ethical approval**, **parental/guardian consent and/or pupil assent** following local law and school policy, and usually a **separate build** (age text, data retention, teacher vs self-paced flow).
- **Research (e.g. PhD) and cross-country use** are supported technically by anonymised storage and dimensional (non-label) reporting, but **each jurisdiction and institution** remains responsible for lawful basis, information sheets, and whether results may be shown in group settings.
- **Language and examples** in `messages/*.json` aim for plain, non-stigmatising wording; all translated strings should be checked by **fluent local reviewers** for cultural fit (including Wolof and Twi/Akan paths in `docs/I18N.md`).

## Core Ethical Principles

### 1. Respect for Persons

**Autonomy and Informed Consent**
- All participation is fully voluntary
- Comprehensive consent process with clear information disclosure
- Right to withdraw at any time without penalty
- Ongoing consent throughout the assessment process

**Dignity and Respect**
- No stigmatizing language or labels
- Emphasis on cognitive diversity as natural variation
- Respect for individual differences and cultural backgrounds
- Avoidance of deficit-based framing

### 2. Beneficence

**Maximizing Benefits**
- Designed for self-understanding and personal growth
- Provides actionable insights for cognitive optimization
- Contributes to scientific knowledge about cognitive diversity
- Free and accessible to all users

**Minimizing Risks**
- No medical or diagnostic claims
- Clear boundaries about system capabilities
- Protection against misinterpretation of results
- Resources for professional support when needed

### 3. Justice

**Equitable Access**
- Free of charge for all users
- No socioeconomic barriers to participation
- Culturally adaptive assessment approaches
- Multiple language support (English, German, Wolof; Twi/Akan draft with English fallback — extend as needed)

**Fair Distribution**
- Research benefits shared with participants
- Open-source tools for researchers
- Community involvement in system development
- Inclusive design processes

### 4. Privacy and Confidentiality

**Data Protection**
- Complete anonymity - no personally identifiable information
- End-to-end encryption for all data transmission
- Secure storage with access controls
- Regular security audits and updates

**Data Usage**
- Research use only, clearly disclosed
- No commercial exploitation of personal data
- Aggregated data for publications only
- Right to data deletion and export

## Informed Consent Process

### Consent Components

1. **Purpose Disclosure**
   - Clear explanation of research goals
   - Description of cognitive mapping approach
   - Expected benefits and limitations
   - Time commitment and process overview

2. **Procedures Information**
   - Assessment process description
   - Data collection methods
   - Question types and response formats
   - Estimated completion time

3. **Risks and Benefits**
   - Minimal risk assessment
   - Potential benefits for self-understanding
   - Limitations of the system
   - Alternative assessment options

4. **Confidentiality Measures**
   - Anonymity guarantees
   - Data storage and protection
   - Publication plans for aggregated data
   - Contact information for concerns

5. **Voluntary Participation**
   - Right to withdraw without penalty
   - Ability to skip questions
   - Data deletion upon withdrawal
   - No impact on any services

### Consent Implementation

**Digital Consent Process**
- Multi-step consent interface
- Comprehension checks
- Explicit agreement checkboxes
- Timestamped consent records

**Ongoing Consent**
- Progress indicators throughout assessment
- Option to withdraw at any point
- Clear withdrawal mechanisms
- Confirmation of withdrawal completion

### Implemented application behaviour (current build)

These items map the principles above to routes and storage in this repository:

- **Dedicated consent** — Users complete a **multi-step** flow at **`/consent`** with explicit checkboxes; questionnaire and results redirect here if consent is missing. Details are stored in browser storage (e.g. consent timestamp key used with Supabase session rows).
- **Results assent** — Before showing scores, the results surface can require an additional **assent** acknowledgement (see results UI and `messages/*` keys).
- **Delete my data** — **`POST /api/delete-session`** removes server-side session data when Supabase and server keys are configured (anonymous session id).
- **Ethics audit** — **`POST /api/ethics-audit`** records non-PII ethics events when the audit table migration has been applied; **`GET /api/ethics/compliance-report`** supports aggregated compliance review (protect with deployment auth as appropriate).
- **Internationalization** — Consent and ethics copy are localized via **`messages/*.json`**; Twi strings remain draft for native-speaker review (see `docs/I18N.md`).

## Data Protection Framework

### Anonymization Strategy

**No PII Collection**
- No names, emails, or personal identifiers
- No IP addresses stored in raw form
- No geolocation data
- No device fingerprinting

**Session-Based Tracking**
- Anonymous session IDs
- Temporary data storage
- Automatic data cleanup
- No cross-session tracking

**Data Minimization**
- Only collect necessary research data
- Question responses and timing only
- No behavioral tracking beyond assessment
- No third-party analytics or tracking

### Security Measures

**Technical Protection**
- HTTPS/TLS encryption for all data
- Database encryption at rest
- Regular security updates
- Access logging and monitoring

**Administrative Controls**
- Role-based access permissions
- Data access audit trails
- Regular security reviews
- Incident response procedures

**Data Retention**
- Defined retention periods
- Automatic data deletion
- Research data archiving
- Compliance with regulations

## Risk Assessment and Mitigation

### Potential Risks

**Psychological Risks**
- Anxiety about cognitive profile results
- Over-interpretation of dimensional scores
- Unintended self-labeling
- Comparison with others

**Privacy Risks**
- Data breach potential
- Re-identification through pattern analysis
- Unauthorized data access
- Cross-platform data correlation

**Social Risks**
- Misunderstanding of research purpose
- Inappropriate sharing of results
- Stigma from cognitive profile
- Discrimination concerns

### Mitigation Strategies

**Psychological Mitigation**
- Clear communication about system limitations
- Emphasis on cognitive diversity and growth
- Resources for professional support
- Balanced presentation of strengths and challenges

**Privacy Mitigation**
- Strong encryption and security measures
- Regular security audits
- Limited data collection scope
- Transparency about data usage

**Social Mitigation**
- Educational materials about cognitive diversity
- Clear non-diagnostic positioning
- Guidelines for appropriate result sharing
- Community engagement and education

## Cultural Considerations

### Cross-Cultural Ethics

**Cultural Adaptation**
- Contextually appropriate question framing
- Cultural validation of assessment items
- Translation and localization processes
- Cultural advisory board input

**Global Equity**
- Free access regardless of location
- Low-bandwidth optimization
- Mobile-friendly interfaces
- Multiple language support

**Respect for Diversity**
- Avoidance of Western-centric assumptions
- Inclusive cognitive model development
- Cultural sensitivity in result interpretation
- Community-specific recommendations

## Research Ethics Compliance

### Regulatory Framework

**International Standards**
- Declaration of Helsinki compliance
- UNESCO Universal Declaration on Bioethics
- International Conference on Harmonization guidelines
- GDPR considerations for global participants — for the operator-facing processing summary (hosting, subprocessors, consent), see [`docs/DEPLOYMENT-LEGAL.md`](./DEPLOYMENT-LEGAL.md) and the in-app privacy route `/privacy` (`messages/*/privacy.json`).

**Institutional Review**
- IRB/REC approval processes
- Ongoing ethical review
- Community advisory boards
- Stakeholder engagement

### Publication Ethics

**Responsible Dissemination**
- Peer-reviewed publication process
- Transparent methodology reporting
- Limitations and biases disclosure
- Open data sharing policies

**Participant Protection**
- No individual results in publications
- Aggregated data only
- Participant anonymity guaranteed
- Right to review publications

## Monitoring and Oversight

### Ethical Review Processes

**Regular Audits**
- Annual ethical review
- Security audit completion
- Participant feedback collection
- Compliance verification

**Advisory Structures**
- Ethics advisory board
- Community representatives
- Cultural consultants
- Disability advocates

**Continuous Improvement**
- Participant feedback integration
- Ethical framework updates
- Best practice incorporation
- Emerging issue monitoring

## Incident Response

### Data Breach Protocol

**Immediate Response**
- System isolation and protection
- Impact assessment initiation
- Regulatory notification (if required)
- Participant communication plan

**Follow-up Actions**
- Security enhancement implementation
- Process review and improvement
- Additional training if needed
- Documentation and reporting

### Ethical Concerns Process

**Reporting Mechanisms**
- Clear contact information
- Multiple reporting channels
- Anonymous reporting options
- Response time guarantees

**Resolution Process**
- Concern acknowledgment
- Investigation procedures
- Resolution communication
- Process improvement

## Future Ethical Considerations

### Emerging Technologies

**AI and Machine Learning**
- Algorithmic bias monitoring
- Transparent AI decision-making
- Human oversight requirements
- Fairness and equity assessments

**Advanced Analytics**
- Privacy-preserving analytics
- Differential privacy implementation
- Secure multi-party computation
- Federated learning approaches

### Expanding Scope

**Clinical Integration**
- Clear boundary maintenance
- Professional collaboration guidelines
- Referral protocol development
- Ethical use frameworks

**Global Expansion**
- Cultural adaptation ethics
- Regulatory compliance across jurisdictions
- Equity in access and benefit
- Community engagement models

## Conclusion

The PCMS ethical framework ensures that the system operates with the highest standards of research integrity, participant protection, and social responsibility. By embedding ethical considerations into every aspect of system design and operation, we create a platform that advances scientific knowledge while respecting the dignity and rights of all participants.

This framework is a living document that evolves with emerging ethical standards, technological capabilities, and community needs. Regular review and updates ensure ongoing alignment with best practices in research ethics and data protection.

---

**Contact**: For ethical concerns or questions, please contact the research ethics board through the project repository.

**Review Schedule**: Annual ethical review with updates as needed.

**Version**: 1.0 - Current as of system initial release.
