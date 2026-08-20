#!/usr/bin/env python3
"""
BUTLER AI — SERVER & REMOTE RELAY PASS PDF GUIDE GENERATOR
Generates an impeccably styled PDF specification guide for the Python companion server
and Secure Remote Relay Pass ($5 Add-On).
"""

import sys
import os

try:
    from reportlab.lib.pagesizes import letter
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
except ImportError:
    print("[-] ReportLab not found. Installing...")
    os.system("sudo pip3 install reportlab")
    from reportlab.lib.pagesizes import letter
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch

def generate_pdf(filename="/home/ubuntu/preserved_60mb/server/Butler_AI_Server_and_Remote_Relay_Guide.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()
    
    # Custom Palette
    c_bg = colors.HexColor("#050810")
    c_panel = colors.HexColor("#0B0F17")
    c_cyan = colors.HexColor("#38D9E8")
    c_green = colors.HexColor("#2FE38A")
    c_amber = colors.HexColor("#FFB43D")
    c_purple = colors.HexColor("#A468FF")
    c_text = colors.HexColor("#DCE6F2")
    c_mid = colors.HexColor("#6B7A92")

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=c_cyan,
        spaceAfter=6
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=c_mid,
        spaceAfter=15
    )

    h1_style = ParagraphStyle(
        'SectionH1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=c_purple,
        spaceBefore=12,
        spaceAfter=6
    )

    body_style = ParagraphStyle(
        'BodyTextCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14,
        textColor=c_text,
        spaceAfter=8
    )

    bullet_style = ParagraphStyle(
        'BulletCustom',
        parent=body_style,
        leftIndent=12,
        spaceAfter=4
    )

    story = []

    # Header block
    story.append(Paragraph("BUTLER AI — COMPANION SERVER & REMOTE RELAY GUIDE", title_style))
    story.append(Paragraph("Version 20.1.0 (OSS Release) · Secure PC Automation & Zero-Knowledge Tunneling", subtitle_style))
    
    # Divider line
    story.append(Table([['']], colWidths=[532], rowHeights=[2], style=TableStyle([('BACKGROUND', (0,0), (-1,-1), c_cyan)])))
    story.append(Spacer(1, 10))

    # Section 1: Architecture Overview
    story.append(Paragraph("1. Python Companion Server Architecture", h1_style))
    story.append(Paragraph(
        "The Butler AI Python companion server (<b>butler_server_v20_1_0_OSS.py</b>) runs locally on your Windows, macOS, or Linux workstation. "
        "It provides secure REST endpoints for PC telemetry, memory storage, script workshop management, and local Ollama model orchestration. "
        "Built on FastAPI and Uvicorn, the server adheres to a strict <b>fail-closed privacy circuit</b>: no telemetry, diagnostics, or chat logs are ever transmitted to external servers.",
        body_style
    ))

    # Section 2: Security & Encryption
    story.append(Paragraph("2. Hardened Vault & E2E Encryption", h1_style))
    story.append(Paragraph(
        "Local memory and paired session tokens are protected by a <b>Hardened Memory Vault</b> implementing AES-256-GCM encryption paired with PBKDF2-HMAC-SHA256 key derivation. "
        "Brute-force attempts against the 6+ digit PIN trigger an automatic fail-closed lockout after 5 consecutive failures, isolating sensitive data from unauthorized physical or remote access.",
        body_style
    ))

    # Section 3: Secure Remote Relay Pass ($5 Add-On)
    story.append(Paragraph("3. Secure Remote Relay Pass ($5 Add-On)", h1_style))
    story.append(Paragraph(
        "When operating outside your home Wi-Fi over cellular networks or foreign hotspots, the <b>Secure Remote Relay Pass</b> enables encrypted out-of-home control without compromising zero-knowledge guarantees:",
        body_style
    ))
    story.append(Paragraph("• <b>Curve25519 ECDH Key Exchange:</b> Establishes a secure cryptographic session between mobile app and PC companion.", bullet_style))
    story.append(Paragraph("• <b>AES-256-GCM Envelope Encryption:</b> All automation commands and script payloads are fully encrypted before touching intermediary relay nodes.", bullet_style))
    story.append(Paragraph("• <b>Blind Forwarder Relay:</b> Relay nodes forward opaque binary blobs with zero decryption capability, preventing third-party interception.", bullet_style))
    story.append(Paragraph("• <b>Lifetime Value:</b> A one-time $5.00 USD purchase unlocks lifetime encrypted remote relay access across personal devices.", bullet_style))

    # Section 4: Quick Start Guide
    story.append(Paragraph("4. Quick Start & Operation", h1_style))
    
    table_data = [
        ['Step', 'Command / Action', 'Description'],
        ['1', 'Install Dependencies', 'Run <code>pip3 install fastapi uvicorn pydantic</code>'],
        ['2', 'Start Server', 'Run <code>python3 butler_server_v20_1_0_OSS.py</code>'],
        ['3', 'Pair Mobile App', 'Scan the terminal QR code or enter IP manually'],
        ['4', 'Automate & Secure', 'Execute scripts, monitor CPU/RAM, and enjoy bulletproof local control']
    ]

    t = Table(table_data, colWidths=[35, 140, 357])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_panel),
        ('TEXTCOLOR', (0,0), (-1,0), c_cyan),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 8.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('GRID', (0,0), (-1,-1), 0.5, c_mid),
        ('TEXTCOLOR', (0,1), (-1,-1), c_text),
        ('BACKGROUND', (0,1), (-1,-1), colors.HexColor("#070A10")),
    ]))
    story.append(t)
    story.append(Spacer(1, 15))

    # Footer notice
    story.append(Paragraph("<b>© 2026 Andrej Sladkovic · All Rights Reserved · Butler AI Proprietary Release</b>", subtitle_style))

    doc.build(story)
    print(f"[+] Successfully generated PDF guide at {filename}")

if __name__ == "__main__":
    generate_pdf()
