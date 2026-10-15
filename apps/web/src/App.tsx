import React, { useState } from 'react';
import {
  LayoutGrid,
  Search,
  Filter,
  Layers,
  Star,
  Clock,
  CheckCircle2,
  FileText,
  Boxes,
  Send,
  Plus,
  Paperclip,
  Activity,
  TrendingUp,
  Check
} from 'lucide-react';

interface EcoCard {
  id: string;
  ecoNumber: string;
  name: string;
  productName: string;
  productRef: string;
  ecoType: string;
  stage: 'new' | 'progress' | 'review' | 'validated' | 'effective';
  priority: number;
  tags: string[];
  responsible: string;
  responsibleInitials: string;
  effectiveDate: string;
  bomChangesCount: number;
  documentsCount: number;
}

export default function App() {
  // Navigation State
  const [currentMenu, setCurrentMenu] = useState<'ecos' | 'products' | 'bom_tree' | 'capabilities'>('ecos');
  const [viewMode, setViewMode] = useState<'kanban' | 'form' | 'list'>('kanban');
  const [selectedEcoId, setSelectedEcoId] = useState<string>('eco-001');
  const [formNotebookTab, setFormNotebookTab] = useState<'bom_changes' | 'approvals' | 'notes'>('bom_changes');

  // Search & Filter
  const [searchFilter, setSearchFilter] = useState('');

  // Chatter State
  const [chatterMessages, setChatterMessages] = useState([
    {
      id: 1,
      author: 'Marcus Vance',
      initials: 'MV',
      time: 'Today at 10:45 AM',
      type: 'status',
      content: 'Stage changed: In Progress ➔ Engineering Review',
    },
    {
      id: 2,
      author: 'Marcus Vance',
      initials: 'MV',
      time: 'Today at 10:48 AM',
      type: 'note',
      content: 'Thermal dissipation model validated under 15A continuous joint load. Tolerance confirmed by OfficeHub Tech Engineering.',
    },
  ]);
  const [newNoteText, setNewNoteText] = useState('');

  // Sample ECOs across standard Odoo PLM stages
  const [ecos, setEcos] = useState<EcoCard[]>([
    {
      id: 'eco-001',
      ecoNumber: 'ECO-2026-0042',
      name: 'Harmonic Actuator Joint 1 & 2 Upgrade',
      productName: 'Autonomous Articulated Robotic Arm',
      productRef: 'ROB-1000',
      ecoType: 'Design Improvement',
      stage: 'review',
      priority: 2,
      tags: ['Mechanical', 'High Torque'],
      responsible: 'Marcus Vance',
      responsibleInitials: 'MV',
      effectiveDate: '2026-10-31',
      bomChangesCount: 3,
      documentsCount: 2,
    },
    {
      id: 'eco-002',
      ecoNumber: 'ECO-2026-0039',
      name: 'CAN-Bus Transceiver AEC-Q100 Replacement',
      productName: 'Multi-Axis Motor Controller PCB',
      productRef: 'PCB-4001',
      ecoType: 'Component Replacement',
      stage: 'progress',
      priority: 3,
      tags: ['Electronics', 'Automotive'],
      responsible: 'Elena Rostova',
      responsibleInitials: 'ER',
      effectiveDate: '2026-11-15',
      bomChangesCount: 1,
      documentsCount: 1,
    },
    {
      id: 'eco-003',
      ecoNumber: 'ECO-2026-0035',
      name: 'Titanium Fastener Weight Reduction',
      productName: 'Autonomous Articulated Robotic Arm',
      productRef: 'ROB-1000',
      ecoType: 'Cost & Weight',
      stage: 'new',
      priority: 1,
      tags: ['Hardware'],
      responsible: 'David Kim',
      responsibleInitials: 'DK',
      effectiveDate: '2026-12-01',
      bomChangesCount: 4,
      documentsCount: 0,
    },
    {
      id: 'eco-004',
      ecoNumber: 'ECO-2026-0028',
      name: 'Optical Encoder Firmware 2.1 Calibration',
      productName: 'Embedded RTOS Motor Controller',
      productRef: 'FRM-9002',
      ecoType: 'Firmware Update',
      stage: 'validated',
      priority: 2,
      tags: ['Firmware', 'Safety'],
      responsible: 'Marcus Vance',
      responsibleInitials: 'MV',
      effectiveDate: '2026-10-20',
      bomChangesCount: 1,
      documentsCount: 3,
    },
    {
      id: 'eco-005',
      ecoNumber: 'ECO-2026-0019',
      name: 'Chassis Cast Aluminum Material Spec',
      productName: 'Heavy Base Stabilizer Mount',
      productRef: 'STB-0081',
      ecoType: 'Manufacturing Routing',
      stage: 'effective',
      priority: 1,
      tags: ['Casting', 'Vendor'],
      responsible: 'Sarah Jenkins',
      responsibleInitials: 'SJ',
      effectiveDate: '2026-09-30',
      bomChangesCount: 2,
      documentsCount: 4,
    },
  ]);

  const activeEco = ecos.find((e) => e.id === selectedEcoId) || ecos[0];

  const stages: { id: EcoCard['stage']; label: string }[] = [
    { id: 'new', label: 'New' },
    { id: 'progress', label: 'In Progress' },
    { id: 'review', label: 'Engineering Review' },
    { id: 'validated', label: 'Validated' },
    { id: 'effective', label: 'Effective' },
  ];

  const bomDiffs = [
    {
      id: 'diff-1',
      action: 'REMOVE',
      component: 'Standard Stepper Actuator',
      partNumber: 'ACT-0021',
      oldQty: 6,
      newQty: 0,
      uom: 'Units',
      notes: 'Phased out due to gear backlash under load',
    },
    {
      id: 'diff-2',
      action: 'ADD',
      component: 'Precision Harmonic Servo Actuator',
      partNumber: 'ROB-1010',
      oldQty: 0,
      newQty: 6,
      uom: 'Units',
      notes: 'Zero-backlash, integrated absolute encoder',
    },
    {
      id: 'diff-3',
      action: 'MODIFY',
      component: 'Drive Bracket Mount Hardware Kit',
      partNumber: 'MNT-0902',
      oldQty: 12,
      newQty: 16,
      uom: 'Units',
      notes: 'Added 4x M5 high-tensile mounting bolts',
    },
  ];

  const [approvals, setApprovals] = useState([
    {
      id: 'app-1',
      stage: 'Engineering Review',
      role: 'Lead Mechanical Engineer',
      user: 'Marcus Vance',
      status: 'APPROVED',
      date: '2026-10-15',
    },
    {
      id: 'app-2',
      stage: 'Engineering Review',
      role: 'Quality & Regulatory Authority',
      user: 'Rachel Adams',
      status: 'PENDING',
      date: '-',
    },
    {
      id: 'app-3',
      stage: 'Validated',
      role: 'Manufacturing Engineering Manager',
      user: 'Carlos Santana',
      status: 'PENDING',
      date: '-',
    },
  ]);

  const handleApprove = (approvalId: string) => {
    setApprovals(
      approvals.map((a) =>
        a.id === approvalId ? { ...a, status: 'APPROVED', date: '2026-10-15' } : a
      )
    );
    setChatterMessages([
      ...chatterMessages,
      {
        id: Date.now(),
        author: 'Marcus Vance',
        initials: 'MV',
        time: 'Just now',
        type: 'status',
        content: 'Quality approval signature registered for stage "Engineering Review".',
      },
    ]);
  };

  const handleStageChange = (newStage: EcoCard['stage']) => {
    setEcos(ecos.map((e) => (e.id === activeEco.id ? { ...e, stage: newStage } : e)));
    setChatterMessages([
      ...chatterMessages,
      {
        id: Date.now(),
        author: 'Marcus Vance',
        initials: 'MV',
        time: 'Just now',
        type: 'status',
        content: `Stage transitioned to: ${stages.find((s) => s.id === newStage)?.label}`,
      },
    ]);
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    setChatterMessages([
      ...chatterMessages,
      {
        id: Date.now(),
        author: 'Marcus Vance',
        initials: 'MV',
        time: 'Just now',
        type: 'note',
        content: newNoteText,
      },
    ]);
    setNewNoteText('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--odoo-bg-gray)' }}>
      {/* 1. TOP NAVBAR IN OFFICEHUB TECH BRAND CHARCOAL (#20242B) & WARM AMBER ORANGE (#F59E0B) */}
      <nav
        style={{
          background: 'var(--brand-charcoal)',
          color: '#ffffff',
          height: '52px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          fontSize: '0.875rem',
          boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
          borderBottom: '2px solid var(--brand-orange)',
          zIndex: 50,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {/* App Switcher Waffle Icon */}
          <button
            style={{
              background: 'transparent',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              padding: '6px',
              borderRadius: '4px',
            }}
            title="App Launcher"
          >
            <LayoutGrid size={18} />
          </button>

          {/* OfficeHub Tech Brand Logo */}
          <div
            onClick={() => {
              setCurrentMenu('ecos');
              setViewMode('kanban');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              background: 'rgba(255, 255, 255, 0.95)',
              padding: '4px 10px',
              borderRadius: '6px',
            }}
          >
            <img
              src="/logo.png"
              alt="OfficeHub Tech Logo"
              style={{
                height: '28px',
                objectFit: 'contain',
                display: 'block',
              }}
            />
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--brand-charcoal)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                borderLeft: '1px solid #cbd5e1',
                paddingLeft: '8px',
              }}
            >
              PLM
            </span>
          </div>

          {/* Navigation Menu Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '8px' }}>
            <button
              onClick={() => {
                setCurrentMenu('ecos');
                setViewMode('kanban');
              }}
              style={{
                background: currentMenu === 'ecos' ? 'var(--brand-orange)' : 'transparent',
                color: currentMenu === 'ecos' ? '#1E293B' : '#ffffff',
                padding: '6px 14px',
                borderRadius: '4px',
                fontWeight: currentMenu === 'ecos' ? 700 : 500,
              }}
            >
              Changes (ECOs)
            </button>

            <button
              onClick={() => {
                setCurrentMenu('products');
                setViewMode('list');
              }}
              style={{
                background: currentMenu === 'products' ? 'var(--brand-orange)' : 'transparent',
                color: currentMenu === 'products' ? '#1E293B' : '#ffffff',
                padding: '6px 14px',
                borderRadius: '4px',
                fontWeight: currentMenu === 'products' ? 700 : 500,
              }}
            >
              Master Data
            </button>

            <button
              onClick={() => {
                setCurrentMenu('bom_tree');
                setViewMode('form');
              }}
              style={{
                background: currentMenu === 'bom_tree' ? 'var(--brand-orange)' : 'transparent',
                color: currentMenu === 'bom_tree' ? '#1E293B' : '#ffffff',
                padding: '6px 14px',
                borderRadius: '4px',
                fontWeight: currentMenu === 'bom_tree' ? 700 : 500,
              }}
            >
              Bill of Materials
            </button>

            <button
              onClick={() => {
                setCurrentMenu('capabilities');
                setViewMode('kanban');
              }}
              style={{
                background: currentMenu === 'capabilities' ? 'var(--brand-orange)' : 'transparent',
                color: currentMenu === 'capabilities' ? '#1E293B' : '#ffffff',
                padding: '6px 14px',
                borderRadius: '4px',
                fontWeight: currentMenu === 'capabilities' ? 700 : 500,
              }}
            >
              Configuration
            </button>
          </div>
        </div>

        {/* Right Header Area: Company Context & User Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8125rem',
              color: 'rgba(255, 255, 255, 0.85)',
              cursor: 'pointer',
            }}
          >
            <Clock size={15} color="var(--brand-orange)" />
            <span>Activities</span>
          </div>

          <div
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              padding: '4px 12px',
              borderRadius: '4px',
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: 'var(--brand-orange)',
            }}
          >
            OfficeHub Tech Enterprise
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'var(--brand-orange)',
                color: '#1E293B',
                fontWeight: 700,
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              MV
            </div>
            <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Marcus Vance</span>
          </div>
        </div>
      </nav>

      {/* 2. ODOO CONTROL PANEL / SUBHEADER */}
      <div
        style={{
          background: '#ffffff',
          borderBottom: '1px solid var(--odoo-border)',
          padding: '10px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Breadcrumbs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', fontWeight: 600 }}>
            <span
              onClick={() => {
                setViewMode('kanban');
                setCurrentMenu('ecos');
              }}
              style={{ color: 'var(--brand-charcoal)', cursor: 'pointer' }}
            >
              Engineering Change Orders
            </span>
            {viewMode === 'form' && (
              <>
                <span style={{ color: 'var(--odoo-text-muted)' }}>/</span>
                <span style={{ color: 'var(--brand-orange-hover)', fontWeight: 700 }}>{activeEco.ecoNumber}</span>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <button
            onClick={() => {
              setViewMode('form');
              setSelectedEcoId('eco-001');
            }}
            className="btn-odoo-primary"
          >
            <Plus size={15} />
            New
          </button>
        </div>

        {/* Search & View Mode Switchers */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '4px',
              padding: '5px 12px',
              width: '320px',
            }}
          >
            <Search size={14} color="var(--odoo-text-muted)" style={{ marginRight: '6px' }} />
            <input
              type="text"
              placeholder="Search ECOs, parts, tags..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                width: '100%',
                fontSize: '0.8125rem',
              }}
            />
            <Filter size={14} color="var(--odoo-text-muted)" style={{ cursor: 'pointer' }} />
          </div>

          <div style={{ display: 'flex', border: '1px solid #cbd5e1', borderRadius: '4px', overflow: 'hidden' }}>
            <button
              onClick={() => setViewMode('kanban')}
              style={{
                padding: '6px 10px',
                background: viewMode === 'kanban' ? 'var(--brand-charcoal)' : '#ffffff',
                color: viewMode === 'kanban' ? 'var(--brand-orange)' : 'var(--odoo-text-muted)',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Kanban View"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              style={{
                padding: '6px 10px',
                background: viewMode === 'list' ? 'var(--brand-charcoal)' : '#ffffff',
                color: viewMode === 'list' ? 'var(--brand-orange)' : 'var(--odoo-text-muted)',
                borderLeft: '1px solid #cbd5e1',
                borderRight: '1px solid #cbd5e1',
                display: 'flex',
                alignItems: 'center',
              }}
              title="List View"
            >
              <Boxes size={15} />
            </button>
            <button
              onClick={() => setViewMode('form')}
              style={{
                padding: '6px 10px',
                background: viewMode === 'form' ? 'var(--brand-charcoal)' : '#ffffff',
                color: viewMode === 'form' ? 'var(--brand-orange)' : 'var(--odoo-text-muted)',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Form View"
            >
              <FileText size={15} />
            </button>
          </div>

          <span style={{ fontSize: '0.8125rem', color: 'var(--odoo-text-muted)' }}>
            1-5 / 5
          </span>
        </div>
      </div>

      {/* 3. MAIN WORKSPACE */}
      <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
        {/* VIEW 1: KANBAN BOARD */}
        {viewMode === 'kanban' && currentMenu === 'ecos' && (
          <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', overflowX: 'auto', paddingBottom: '20px' }}>
            {stages.map((stg) => {
              const stageEcos = ecos.filter((e) => e.stage === stg.id);
              return (
                <div key={stg.id} className="odoo-kanban-column">
                  {/* Column Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--brand-charcoal)' }}>
                        {stg.label}
                      </span>
                      <span
                        style={{
                          background: '#ffffff',
                          color: 'var(--brand-charcoal)',
                          padding: '1px 7px',
                          borderRadius: '10px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          border: '1px solid #cbd5e1',
                        }}
                      >
                        {stageEcos.length}
                      </span>
                    </div>

                    <button style={{ background: 'transparent', color: 'var(--odoo-text-muted)' }}>
                      <Plus size={16} />
                    </button>
                  </div>

                  {/* Cards inside Stage */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {stageEcos.map((eco) => (
                      <div
                        key={eco.id}
                        className="odoo-kanban-card"
                        onClick={() => {
                          setSelectedEcoId(eco.id);
                          setViewMode('form');
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--brand-charcoal)', fontWeight: 700 }}>
                            {eco.ecoNumber}
                          </span>
                          <div style={{ display: 'flex', gap: '2px', color: 'var(--brand-orange)' }}>
                            {Array.from({ length: eco.priority }).map((_, i) => (
                              <Star key={i} size={12} fill="var(--brand-orange)" />
                            ))}
                          </div>
                        </div>

                        <div style={{ fontWeight: 600, fontSize: '0.875rem', marginTop: '6px', color: 'var(--odoo-text-main)' }}>
                          {eco.name}
                        </div>

                        <div style={{ fontSize: '0.8125rem', color: 'var(--odoo-text-muted)', marginTop: '4px' }}>
                          [{eco.productRef}] {eco.productName}
                        </div>

                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '8px' }}>
                          {eco.tags.map((t, idx) => (
                            <span
                              key={idx}
                              style={{
                                background: '#fef3c7',
                                color: '#92400e',
                                fontSize: '0.7rem',
                                padding: '2px 6px',
                                borderRadius: '3px',
                                fontWeight: 500,
                              }}
                            >
                              {t}
                            </span>
                          ))}
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginTop: '12px',
                            paddingTop: '8px',
                            borderTop: '1px solid #f1f5f9',
                          }}
                        >
                          <span style={{ fontSize: '0.75rem', color: 'var(--brand-orange-hover)', fontWeight: 700 }}>
                            {eco.bomChangesCount} BOM Changes
                          </span>

                          <div
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              background: 'var(--brand-charcoal)',
                              color: 'var(--brand-orange)',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            title={eco.responsible}
                          >
                            {eco.responsibleInitials}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* VIEW 2: FORM VIEW ("THE SHEET") */}
        {viewMode === 'form' && currentMenu === 'ecos' && (
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div className="odoo-sheet">
              {/* Statusbar */}
              <div className="odoo-statusbar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {activeEco.stage === 'new' && (
                    <button
                      onClick={() => handleStageChange('progress')}
                      className="btn-odoo-primary"
                    >
                      Start Revision
                    </button>
                  )}

                  {activeEco.stage === 'progress' && (
                    <button
                      onClick={() => handleStageChange('review')}
                      className="btn-odoo-primary"
                    >
                      Send for Review
                    </button>
                  )}

                  {activeEco.stage === 'review' && (
                    <button
                      onClick={() => handleStageChange('validated')}
                      className="btn-odoo-primary"
                    >
                      Validate ECO
                    </button>
                  )}

                  {activeEco.stage === 'validated' && (
                    <button
                      onClick={() => handleStageChange('effective')}
                      className="btn-odoo-primary"
                      style={{ background: 'var(--odoo-success)', color: '#ffffff' }}
                    >
                      Apply Changes & Release BOM
                    </button>
                  )}

                  <button className="btn-odoo-secondary">Cancel</button>
                </div>

                {/* Sequential Stage Chevron Tracker */}
                <div className="odoo-stage-pipeline">
                  {stages.map((stg) => (
                    <div
                      key={stg.id}
                      onClick={() => handleStageChange(stg.id)}
                      className={`odoo-stage-step ${activeEco.stage === stg.id ? 'active' : ''}`}
                    >
                      {stg.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Sheet Body */}
              <div style={{ padding: '24px' }}>
                {/* Smart Buttons Row */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginBottom: '20px' }}>
                  <div className="odoo-stat-button">
                    <Boxes size={22} color="var(--brand-charcoal)" />
                    <div>
                      <div className="odoo-stat-num">Rev B</div>
                      <div className="odoo-stat-label">BOM Version</div>
                    </div>
                  </div>

                  <div className="odoo-stat-button">
                    <TrendingUp size={22} color="var(--brand-orange)" />
                    <div>
                      <div className="odoo-stat-num">{activeEco.bomChangesCount}</div>
                      <div className="odoo-stat-label">BOM Changes</div>
                    </div>
                  </div>

                  <div className="odoo-stat-button">
                    <Paperclip size={22} color="#64748b" />
                    <div>
                      <div className="odoo-stat-num">{activeEco.documentsCount}</div>
                      <div className="odoo-stat-label">Documents</div>
                    </div>
                  </div>
                </div>

                {/* Form Header */}
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ fontSize: '0.875rem', color: 'var(--brand-orange-hover)', fontWeight: 700 }}>
                    {activeEco.ecoNumber}
                  </div>
                  <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--brand-charcoal)', marginTop: '2px' }}>
                    {activeEco.name}
                  </h1>
                </div>

                {/* 2-Column Fields Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: '#475569' }}>Product:</span>
                      <span style={{ color: 'var(--brand-charcoal)', fontWeight: 700 }}>
                        [{activeEco.productRef}] {activeEco.productName}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: '#475569' }}>Bill of Materials:</span>
                      <span>BOM-{activeEco.productRef}-01 (Normal BOM)</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: '#475569' }}>ECO Type:</span>
                      <span>{activeEco.ecoType}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: '#475569' }}>Responsible:</span>
                      <span>{activeEco.responsible}</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: '#475569' }}>Effective Date:</span>
                      <span>{activeEco.effectiveDate}</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: '#475569' }}>Company:</span>
                      <span style={{ fontWeight: 600 }}>OfficeHub Tech</span>
                    </div>
                  </div>
                </div>

                {/* Notebook Tabs */}
                <div style={{ borderBottom: '1px solid var(--odoo-border)', display: 'flex', gap: '8px' }}>
                  {[
                    { id: 'bom_changes', label: `BOM Changes (${activeEco.bomChangesCount})` },
                    { id: 'approvals', label: 'Approvals & Signatures' },
                    { id: 'notes', label: 'Engineering Rationale' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setFormNotebookTab(tab.id as any)}
                      style={{
                        padding: '10px 16px',
                        background: 'transparent',
                        color: formNotebookTab === tab.id ? 'var(--brand-orange-hover)' : 'var(--odoo-text-muted)',
                        fontWeight: formNotebookTab === tab.id ? 700 : 500,
                        borderBottom: formNotebookTab === tab.id ? '3px solid var(--brand-orange)' : '3px solid transparent',
                        fontSize: '0.875rem',
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* TAB 1: BOM CHANGES (DIFF TABLE) */}
                {formNotebookTab === 'bom_changes' && (
                  <div style={{ paddingTop: '16px' }}>
                    <table className="odoo-table">
                      <thead>
                        <tr>
                          <th>Action</th>
                          <th>Component</th>
                          <th>Product Part Number</th>
                          <th>Old Quantity</th>
                          <th>New Quantity</th>
                          <th>Unit of Measure</th>
                          <th>Engineering Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bomDiffs.map((diff) => (
                          <tr key={diff.id}>
                            <td>
                              <span
                                style={{
                                  fontSize: '0.75rem',
                                  padding: '2px 8px',
                                  borderRadius: '3px',
                                  fontWeight: 600,
                                  background:
                                    diff.action === 'ADD'
                                      ? '#d1fae5'
                                      : diff.action === 'REMOVE'
                                      ? '#fee2e2'
                                      : '#fef3c7',
                                  color:
                                    diff.action === 'ADD'
                                      ? '#065f46'
                                      : diff.action === 'REMOVE'
                                      ? '#991b1b'
                                      : '#92400e',
                                }}
                              >
                                {diff.action === 'ADD' ? '+ ADDED' : diff.action === 'REMOVE' ? '- REMOVED' : 'MODIFIED'}
                              </span>
                            </td>
                            <td style={{ fontWeight: 600 }}>{diff.component}</td>
                            <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>{diff.partNumber}</td>
                            <td style={{ color: diff.action === 'REMOVE' ? '#ef4444' : 'inherit' }}>
                              {diff.oldQty}
                            </td>
                            <td style={{ color: diff.action === 'ADD' ? '#10b981' : 'inherit', fontWeight: 600 }}>
                              {diff.newQty}
                            </td>
                            <td>{diff.uom}</td>
                            <td style={{ color: 'var(--odoo-text-muted)', fontSize: '0.8125rem' }}>{diff.notes}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* TAB 2: APPROVALS */}
                {formNotebookTab === 'approvals' && (
                  <div style={{ paddingTop: '16px' }}>
                    <table className="odoo-table">
                      <thead>
                        <tr>
                          <th>Stage</th>
                          <th>Required Role</th>
                          <th>Assigned Approver</th>
                          <th>Approval Status</th>
                          <th>Date Approved</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {approvals.map((app) => (
                          <tr key={app.id}>
                            <td style={{ fontWeight: 600 }}>{app.stage}</td>
                            <td>{app.role}</td>
                            <td>{app.user}</td>
                            <td>
                              <span
                                style={{
                                  fontSize: '0.75rem',
                                  padding: '2px 8px',
                                  borderRadius: '3px',
                                  fontWeight: 600,
                                  background: app.status === 'APPROVED' ? '#d1fae5' : '#fef3c7',
                                  color: app.status === 'APPROVED' ? '#065f46' : '#92400e',
                                }}
                              >
                                {app.status}
                              </span>
                            </td>
                            <td>{app.date}</td>
                            <td>
                              {app.status === 'PENDING' ? (
                                <button
                                  onClick={() => handleApprove(app.id)}
                                  className="btn-odoo-primary"
                                  style={{ padding: '3px 10px', fontSize: '0.75rem' }}
                                >
                                  <Check size={12} />
                                  Approve
                                </button>
                              ) : (
                                <span style={{ color: '#10b981', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                                  <CheckCircle2 size={14} /> Signed
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* TAB 3: NOTES */}
                {formNotebookTab === 'notes' && (
                  <div style={{ paddingTop: '16px', color: '#334155', fontSize: '0.875rem', lineHeight: '1.6' }}>
                    <p>
                      <strong>Summary of Change:</strong> Replaces baseline stepper motor actuators on joint 1 and 2 with high-precision harmonic drive servo units to eliminate 0.8mm backlash under payload conditions.
                    </p>
                    <p style={{ marginTop: '10px' }}>
                      <strong>Tooling & Inventory Impact:</strong> Current inventory of 14 units of ACT-0021 can be retrofitted or repurposed for non-precision auxiliary conveyors. Zero scrap penalty incurred by OfficeHub Tech.
                    </p>
                  </div>
                )}
              </div>

              {/* Odoo Chatter */}
              <div
                style={{
                  background: '#f8fafc',
                  borderTop: '1px solid var(--odoo-border)',
                  padding: '20px 24px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn-odoo-secondary" style={{ fontSize: '0.8125rem' }}>
                      <Send size={14} />
                      Send message
                    </button>
                    <button className="btn-odoo-secondary" style={{ fontSize: '0.8125rem' }}>
                      <FileText size={14} />
                      Log note
                    </button>
                    <button className="btn-odoo-secondary" style={{ fontSize: '0.8125rem' }}>
                      <Activity size={14} />
                      Activities
                    </button>
                  </div>

                  <div style={{ fontSize: '0.8125rem', color: 'var(--odoo-text-muted)' }}>
                    <strong>3</strong> Followers
                  </div>
                </div>

                <form onSubmit={handleAddNote} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                  <input
                    type="text"
                    placeholder="Log an internal engineering note or comment..."
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    style={{
                      flex: 1,
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '4px',
                      padding: '8px 12px',
                      fontSize: '0.875rem',
                    }}
                  />
                  <button type="submit" className="btn-odoo-primary" style={{ padding: '8px 16px' }}>
                    Post
                  </button>
                </form>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {chatterMessages.map((msg) => (
                    <div key={msg.id} style={{ display: 'flex', gap: '12px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: 'var(--brand-charcoal)',
                          color: 'var(--brand-orange)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                        }}
                      >
                        {msg.initials}
                      </div>
                      <div style={{ flex: 1, background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '10px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--odoo-text-main)' }}>
                            {msg.author}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--odoo-text-muted)' }}>
                            {msg.time}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.875rem', color: msg.type === 'status' ? 'var(--brand-orange-hover)' : '#334155' }}>
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: MASTER DATA */}
        {currentMenu === 'products' && (
          <div className="odoo-sheet" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--brand-charcoal)' }}>
                OfficeHub Tech — Product Master
              </h2>
              <button className="btn-odoo-primary">
                <Plus size={14} /> Create Product
              </button>
            </div>

            <table className="odoo-table">
              <thead>
                <tr>
                  <th>Internal Reference</th>
                  <th>Name</th>
                  <th>Product Type</th>
                  <th>Current Revision</th>
                  <th>Status</th>
                  <th>Unit of Measure</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { ref: 'ROB-1000', name: 'Autonomous Articulated Robotic Arm', type: 'Assembly', rev: 'Rev B', status: 'In Review', uom: 'Units' },
                  { ref: 'ROB-1010', name: 'Precision Harmonic Servo Actuator', type: 'Manufactured', rev: 'Rev B', status: 'Released', uom: 'Units' },
                  { ref: 'PCB-4001', name: 'Multi-Axis Motor Controller PCB', type: 'Assembly', rev: 'Rev A', status: 'Released', uom: 'Units' },
                  { ref: 'ELC-0052', name: 'CAN-Bus Transceiver IC (AEC-Q100)', type: 'Purchased', rev: 'Rev A', status: 'Released', uom: 'Units' },
                  { ref: 'FRM-9002', name: 'Embedded RTOS Motor Controller Firmware', type: 'Software', rev: '1.2.0', status: 'Draft', uom: 'Units' },
                ].map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--brand-orange-hover)' }}>{item.ref}</td>
                    <td style={{ fontWeight: 600 }}>{item.name}</td>
                    <td>{item.type}</td>
                    <td>{item.rev}</td>
                    <td>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          padding: '2px 8px',
                          borderRadius: '3px',
                          fontWeight: 600,
                          background: item.status === 'Released' ? '#d1fae5' : item.status === 'In Review' ? '#fef3c7' : '#fee2e2',
                          color: item.status === 'Released' ? '#065f46' : item.status === 'In Review' ? '#92400e' : '#991b1b',
                        }}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td>{item.uom}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* VIEW 4: BOM TREE */}
        {currentMenu === 'bom_tree' && (
          <div className="odoo-sheet" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <span style={{ fontSize: '0.8125rem', color: 'var(--brand-orange-hover)', fontWeight: 700 }}>BOM-ROB-1000-01</span>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--brand-charcoal)', marginTop: '2px' }}>
                  Bill of Materials — Autonomous Articulated Robotic Arm
                </h2>
              </div>
              <span style={{ background: '#d1fae5', color: '#065f46', padding: '4px 10px', borderRadius: '4px', fontSize: '0.8125rem', fontWeight: 700 }}>
                Normal BOM · Rev A
              </span>
            </div>

            <table className="odoo-table">
              <thead>
                <tr>
                  <th>Level</th>
                  <th>Component</th>
                  <th>Reference</th>
                  <th>Quantity</th>
                  <th>Unit of Measure</th>
                  <th>Reference Designators</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>0</strong></td>
                  <td style={{ fontWeight: 700 }}>Autonomous Articulated Robotic Arm</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>ROB-1000</td>
                  <td>1.0</td>
                  <td>Units</td>
                  <td>-</td>
                </tr>
                <tr>
                  <td style={{ paddingLeft: '28px' }}>├── 1.1</td>
                  <td style={{ fontWeight: 600 }}>Precision Harmonic Servo Actuator</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>ROB-1010</td>
                  <td style={{ fontWeight: 600 }}>6.0</td>
                  <td>Units</td>
                  <td>Joints 1–6</td>
                </tr>
                <tr>
                  <td style={{ paddingLeft: '28px' }}>├── 1.2</td>
                  <td style={{ fontWeight: 600 }}>Multi-Axis Motor Controller PCB</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>PCB-4001</td>
                  <td style={{ fontWeight: 600 }}>1.0</td>
                  <td>Units</td>
                  <td>Main Bay</td>
                </tr>
                <tr>
                  <td style={{ paddingLeft: '56px' }}>└── 2.1</td>
                  <td>CAN-Bus Transceiver IC</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>ELC-0052</td>
                  <td>2.0</td>
                  <td>Units</td>
                  <td style={{ color: 'var(--brand-orange-hover)', fontWeight: 700 }}>U1, U2</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* VIEW 5: CONFIGURATION */}
        {currentMenu === 'capabilities' && (
          <div className="odoo-sheet" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--brand-charcoal)', marginBottom: '6px' }}>
              OfficeHub Tech — Industry Capability Plugins
            </h2>
            <p style={{ color: 'var(--odoo-text-muted)', fontSize: '0.875rem', marginBottom: '20px' }}>
              Configurable domain capability extensions on the Universal PLM shared engineering core.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {[
                { title: 'Discrete Manufacturing & Automotive', desc: 'EBOM-to-MBOM transformation, routings, work centers, serial/lot effectivity.', active: true },
                { title: 'Electronics & PCB Hardware', desc: 'Reference designators (R1, C12), component footprints, manufacturer part numbers (MPN).', active: true },
                { title: 'Process & Chemical Formulation', desc: 'Formulations, recipe batch scaling, ingredient yields, unit conversions.', active: false },
                { title: 'Regulated Medical Devices & Aerospace', desc: 'Design History File (DHF), Device Master Record (DMR), 21 CFR Part 11 signatures.', active: false },
              ].map((item, i) => (
                <div key={i} style={{ border: '1px solid var(--odoo-border)', borderRadius: '4px', padding: '16px', background: '#ffffff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 700 }}>{item.title}</h3>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        padding: '2px 8px',
                        borderRadius: '3px',
                        fontWeight: 700,
                        background: item.active ? '#fef3c7' : '#f1f5f9',
                        color: item.active ? '#92400e' : '#64748b',
                      }}
                    >
                      {item.active ? 'Installed' : 'Available'}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--odoo-text-muted)', marginTop: '8px', lineHeight: '1.4' }}>
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
