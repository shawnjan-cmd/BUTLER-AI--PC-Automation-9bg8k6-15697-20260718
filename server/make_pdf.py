import markdown
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

def generate_pdf():
    pdf_path = '/home/ubuntu/preserved_60mb/server/BUTLER_AI_CODING_AI_UPGRADE_GUIDE.pdf'
    doc = SimpleDocTemplate(pdf_path, pagesize=letter, rightMargin=54, leftMargin=54, topMargin=54, bottomMargin=54)
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=15,
        textColor=colors.HexColor('#0044cc'),
        spaceAfter=8
    )
    
    heading_style = ParagraphStyle(
        'DocHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=11.5,
        textColor=colors.HexColor('#333333'),
        spaceBefore=10,
        spaceAfter=3
    )
    
    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        textColor=colors.HexColor('#222222'),
        spaceAfter=5,
        leading=12.5
    )
    
    code_style = ParagraphStyle(
        'DocCode',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8,
        textColor=colors.HexColor('#880000'),
        backColor=colors.HexColor('#f5f5f5'),
        spaceBefore=2,
        spaceAfter=2,
        leading=10.5
    )

    story = []
    
    story.append(Paragraph("Butler AI: Master Visual Prompt & Defensive Handoff Guide", title_style))
    story.append(Paragraph("<b>Scope:</b> OnSpace.ai / React Native Expo (<b>NO WEB FILES</b>) | <b>Author:</b> Manus AI", body_style))
    story.append(Spacer(1, 4))
    
    story.append(Paragraph("1. Executive Overview & Strict Constraints", heading_style))
    story.append(Paragraph("This manual establishes mandatory architectural and visual standards for Butler AI. The application is strictly exclusive to <b>OnSpace.ai / React Native Expo</b>. All web files (`.html`, `.css`, web static exports) are strictly prohibited and must be instantly removed.", body_style))
    
    story.append(Paragraph("2. Visual Styling & Responsive Centering Specifications", heading_style))
    story.append(Paragraph("• <b>Cyberpunk Dark Aesthetic:</b> Obsidian backgrounds (`#0a0f18`), glowing cyan/teal neon borders (`#00f0ff`), and crisp glassmorphism cards.<br/>• <b>Universal Centering & Auto-Resizing:</b> All UI containers, headers, and buttons must use flexible flexbox centering (`flex: 1`, `alignItems: 'center'`, `justifyContent: 'center'`) that instantly adapts to any mobile screen size or resolution.<br/>• <b>HUD Telemetry & Dock:</b> Top status bar showing self-hosted zero-cloud status, animated branding, clock, and security badge; bottom navigation dock for CORE, LIB, BTLR, KB, MONI, SKIN, TOOLS, CFG.", body_style))
    
    story.append(Paragraph("3. Complete API Endpoint Reference", heading_style))
    data = [
        ["Endpoint", "Method", "Purpose"],
        ["/api/health", "GET", "Server health and version check"],
        ["/vault/unlock", "POST", "Unlocks Hardened Memory Vault with PIN"],
        ["/scripts/create", "POST", "Validates AST syntax and trust scan"],
        ["/recovery/panic", "POST", "Triggers fail-closed security circuit"],
        ["/api/leaderboard/chat", "POST", "Submits achievement scores and chat"]
    ]
    t = Table(data, colWidths=[110, 50, 344])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0044cc')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,0), 8.5),
        ('BOTTOMPADDING', (0,0), (-1,0), 3),
        ('BACKGROUND', (0,1), (-1,-1), colors.HexColor('#f9f9f9')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#dddddd')),
        ('FONTNAME', (0,1), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,1), (-1,-1), 8),
        ('TOPPADDING', (0,1), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,1), (-1,-1), 2.5),
    ]))
    story.append(t)
    story.append(Spacer(1, 4))
    
    story.append(Paragraph("4. CHECK LAST — Final Verification Protocol", heading_style))
    story.append(Paragraph("Before completing any coding task, verify:<br/>1. <b>Zero Web Files:</b> Confirm no HTML/CSS files exist.<br/>2. <b>Responsive Centering:</b> Verify UI flexbox alignment across screen sizes.<br/>3. <b>Type Safety:</b> Run <code>pnpm exec tsc --noEmit</code>.<br/>4. <b>Unit Tests:</b> Run <code>python3 -m unittest discover -s server -p '*_test.py'</code>.", body_style))

    doc.build(story)
    print("Visual prompt PDF generated successfully.")

if __name__ == '__main__':
    generate_pdf()
