import React, { useState } from 'react';
import {
  LayoutGrid,
  Search,
  Filter,
  Layers,
  Star,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Boxes,
  GitBranch,
  Settings,
  ChevronRight,
  ChevronDown,
  Paperclip,
  MessageSquare,
  Activity,
  UserCheck,
  Send,
  Plus,
  ArrowRight,
  TrendingUp,
  Sliders,
  FolderTree,
  Eye,
  Check,
  ExternalLink,
  ShieldAlert
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
  const [activeFilter, setActiveFilter] = useState<'all' | 'my' | 'in_review'>('all');

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
      content: 'Thermal dissipation model validated under 15A continuous joint load. Tolerance confirmed.',
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

  // Selected ECO details
  const activeEco = ecos.find((e) => e.id === selectedEcoId) || ecos[0];

  // Stage definitions matching standard Odoo PLM pipeline
  const stages: { id: EcoCard['stage']; label: string }[] = [
    { id: 'new', label: 'New' },
    { id: 'progress', label: 'In Progress' },
    { id: 'review', label: 'Engineering Review' },
    { id: 'validated', label: 'Validated' },
    { id: 'effective', label: 'Effective' },
  ];

  // Odoo BOM Diff changes for the active ECO
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

  // Approvals matrix in Odoo style
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
    // Add chatter note
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
      {/* 1. ODOO SIGNATURE PURPLE TOP BAR */}
      <nav
        style={{
          background: 'var(--odoo-purple)',
          color: '#ffffff',
          height: '46px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          fontSize: '0.875rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
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
              padding: '4px',
              borderRadius: '3px',
            }}
            title="Odoo App Switcher"
          >
            <LayoutGrid size={18} />
          </button>

          {/* Odoo App Title */}
          <span style={{ fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.01em' }}>
            PLM
          </span>

          {/* Odoo Top Navigation Menu Items */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              onClick={() => {
                setCurrentMenu('ecos');
                setViewMode('kanban');
              }}
              style={{
                background: currentMenu === 'ecos' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                color: '#ffffff',
                padding: '6px 12px',
                borderRadius: '3px',
                fontWeight: currentMenu === 'ecos' ? 600 : 400,
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
                background: currentMenu === 'products' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                color: '#ffffff',
                padding: '6px 12px',
                borderRadius: '3px',
                fontWeight: currentMenu === 'products' ? 600 : 400,
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
                background: currentMenu === 'bom_tree' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                color: '#ffffff',
                padding: '6px 12px',
                borderRadius: '3px',
                fontWeight: currentMenu === 'bom_tree' ? 600 : 400,
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
                background: currentMenu === 'capabilities' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                color: '#ffffff',
                padding: '6px 12px',
                borderRadius: '3px',
                fontWeight: currentMenu === 'capabilities' ? 600 : 400,
              }}
            >
              Configuration
            </button>
          </div>
        </div>

        {/* Right Corner: Company Switcher & User Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8125rem',
              color: 'rgba(255, 255, 255, 0.9)',
              cursor: 'pointer',
            }}
          >
            <Clock size={15} />
            <span>Activities</span>
          </div>

          <div
            style={{
              background: 'rgba(0, 0, 0, 0.2)',
              padding: '3px 10px',
              borderRadius: '3px',
              fontSize: '0.8125rem',
              fontWeight: 500,
            }}
          >
            Acme Robotics (San Francisco)
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                background: '#ffffff',
                color: 'var(--odoo-purple)',
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
              style={{ color: 'var(--odoo-purple)', cursor: 'pointer' }}
            >
              Engineering Change Orders
            </span>
            {viewMode === 'form' && (
              <>
                <span style={{ color: 'var(--odoo-text-muted)' }}>/</span>
                <span style={{ color: 'var(--odoo-text-main)' }}>{activeEco.ecoNumber}</span>
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

        {/* Search, Filters & View Switchers */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Odoo Search Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: '#f8f9fa',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              padding: '4px 10px',
              width: '320px',
            }}
          >
            <Search size={14} color="var(--odoo-text-muted)" style={{ marginRight: '6px' }} />
            <input
              type="text"
              placeholder="Search ECOs, components, tags..."
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

          {/* View Mode Switchers (Odoo Classic: Kanban, List, Form) */}
          <div style={{ display: 'flex', border: '1px solid #ced4da', borderRadius: '4px', overflow: 'hidden' }}>
            <button
              onClick={() => setViewMode('kanban')}
              style={{
                padding: '6px 10px',
                background: viewMode === 'kanban' ? 'var(--odoo-purple)' : '#ffffff',
                color: viewMode === 'kanban' ? '#ffffff' : 'var(--odoo-text-muted)',
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
                background: viewMode === 'list' ? 'var(--odoo-purple)' : '#ffffff',
                color: viewMode === 'list' ? '#ffffff' : 'var(--odoo-text-muted)',
                borderLeft: '1px solid #ced4da',
                borderRight: '1px solid #ced4da',
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
                background: viewMode === 'form' ? 'var(--odoo-purple)' : '#ffffff',
                color: viewMode === 'form' ? '#ffffff' : 'var(--odoo-text-muted)',
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
        {/* VIEW 1: ODOO KANBAN BOARD */}
        {viewMode === 'kanban' && currentMenu === 'ecos' && (
          <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', overflowX: 'auto', paddingBottom: '20px' }}>
            {stages.map((stg) => {
              const stageEcos = ecos.filter((e) => e.stage === stg.id);
              return (
                <div key={stg.id} className="odoo-kanban-column">
                  {/* Column Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--odoo-text-main)' }}>
                        {stg.label}
                      </span>
                      <span
                        style={{
                          background: '#ffffff',
                          color: 'var(--odoo-text-muted)',
                          padding: '1px 7px',
                          borderRadius: '10px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          border: '1px solid #d8dde3',
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
                          <span style={{ fontSize: '0.75rem', color: 'var(--odoo-purple)', fontWeight: 600 }}>
                            {eco.ecoNumber}
                          </span>
                          <div style={{ display: 'flex', gap: '2px', color: '#f59e0b' }}>
                            {Array.from({ length: eco.priority }).map((_, i) => (
                              <Star key={i} size={12} fill="#f59e0b" />
                            ))}
                          </div>
                        </div>

                        <div style={{ fontWeight: 600, fontSize: '0.875rem', marginTop: '6px', color: 'var(--odoo-text-main)' }}>
                          {eco.name}
                        </div>

                        <div style={{ fontSize: '0.8125rem', color: 'var(--odoo-text-muted)', marginTop: '4px' }}>
                          [{eco.productRef}] {eco.productName}
                        </div>

                        {/* Tags */}
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '8px' }}>
                          {eco.tags.map((t, idx) => (
                            <span
                              key={idx}
                              style={{
                                background: '#edf2f7',
                                color: '#4a5568',
                                fontSize: '0.7rem',
                                padding: '2px 6px',
                                borderRadius: '3px',
                              }}
                            >
                              {t}
                            </span>
                          ))}
                        </div>

                        {/* Card Footer: BOM Changes count & Assignee */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginTop: '12px',
                            paddingTop: '8px',
                            borderTop: '1px solid #f0f3f6',
                          }}
                        >
                          <span style={{ fontSize: '0.75rem', color: 'var(--odoo-teal)', fontWeight: 600 }}>
                            {eco.bomChangesCount} BOM Changes
                          </span>

                          <div
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              background: 'var(--odoo-purple)',
                              color: '#ffffff',
                              fontSize: '0.7rem',
                              fontWeight: 600,
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

        {/* VIEW 2: ODOO SIGNATURE FORM VIEW ("THE SHEET") */}
        {viewMode === 'form' && currentMenu === 'ecos' && (
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div className="odoo-sheet">
              {/* Odoo Statusbar: Action Buttons on Left, Arrow Chevron Pipeline on Right */}
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
                      className="btn-odoo-teal"
                    >
                      Apply Changes & Release BOM
                    </button>
                  )}

                  <button className="btn-odoo-secondary">Cancel</button>
                </div>

                {/* Sequential Stage Chevron */}
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
                {/* Smart Buttons Row (Top-Right Stat Boxes) */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginBottom: '20px' }}>
                  <div className="odoo-stat-button">
                    <Boxes size={22} color="var(--odoo-purple)" />
                    <div>
                      <div className="odoo-stat-num">Rev B</div>
                      <div className="odoo-stat-label">BOM Version</div>
                    </div>
                  </div>

                  <div className="odoo-stat-button">
                    <TrendingUp size={22} color="var(--odoo-teal)" />
                    <div>
                      <div className="odoo-stat-num">{activeEco.bomChangesCount}</div>
                      <div className="odoo-stat-label">BOM Changes</div>
                    </div>
                  </div>

                  <div className="odoo-stat-button">
                    <Paperclip size={22} color="#6c757d" />
                    <div>
                      <div className="odoo-stat-num">{activeEco.documentsCount}</div>
                      <div className="odoo-stat-label">Documents</div>
                    </div>
                  </div>
                </div>

                {/* Form Main Title */}
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ fontSize: '0.875rem', color: 'var(--odoo-purple)', fontWeight: 600 }}>
                    {activeEco.ecoNumber}
                  </div>
                  <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--odoo-text-main)', marginTop: '2px' }}>
                    {activeEco.name}
                  </h1>
                </div>

                {/* Odoo Standard 2-Column Fields Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: '#495057' }}>Product:</span>
                      <span style={{ color: 'var(--odoo-purple)', fontWeight: 600 }}>
                        [{activeEco.productRef}] {activeEco.productName}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: '#495057' }}>Bill of Materials:</span>
                      <span>BOM-{activeEco.productRef}-01 (Normal BOM)</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: '#495057' }}>ECO Type:</span>
                      <span>{activeEco.ecoType}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: '#495057' }}>Responsible:</span>
                      <span>{activeEco.responsible}</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: '#495057' }}>Effective Date:</span>
                      <span>{activeEco.effectiveDate}</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: '#495057' }}>Company:</span>
                      <span>Acme Robotics Corp</span>
                    </div>
                  </div>
                </div>

                {/* Notebook Tabs (Odoo Style) */}
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
                        color: formNotebookTab === tab.id ? 'var(--odoo-purple)' : 'var(--odoo-text-muted)',
                        fontWeight: formNotebookTab === tab.id ? 700 : 500,
                        borderBottom: formNotebookTab === tab.id ? '2px solid var(--odoo-purple)' : '2px solid transparent',
                        fontSize: '0.875rem',
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* TAB 1: BOM CHANGES (THE CLASSIC ODOO BOM REDLINE DIFF TABLE) */}
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
                                      ? '#d4edda'
                                      : diff.action === 'REMOVE'
                                      ? '#f8d7da'
                                      : '#cce5ff',
                                  color:
                                    diff.action === 'ADD'
                                      ? '#155724'
                                      : diff.action === 'REMOVE'
                                      ? '#721c24'
                                      : '#004085',
                                }}
                              >
                                {diff.action === 'ADD' ? '+ ADDED' : diff.action === 'REMOVE' ? '- REMOVED' : 'MODIFIED'}
                              </span>
                            </td>
                            <td style={{ fontWeight: 600 }}>{diff.component}</td>
                            <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>{diff.partNumber}</td>
                            <td style={{ color: diff.action === 'REMOVE' ? '#dc3545' : 'inherit' }}>
                              {diff.oldQty}
                            </td>
                            <td style={{ color: diff.action === 'ADD' ? '#28a745' : 'inherit', fontWeight: 600 }}>
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
                                  background: app.status === 'APPROVED' ? '#d4edda' : '#fff3cd',
                                  color: app.status === 'APPROVED' ? '#155724' : '#856404',
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
                                  className="btn-odoo-teal"
                                  style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                                >
                                  <Check size={12} />
                                  Approve
                                </button>
                              ) : (
                                <span style={{ color: '#28a745', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
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
                  <div style={{ paddingTop: '16px', color: '#495057', fontSize: '0.875rem', lineHeight: '1.6' }}>
                    <p>
                      <strong>Summary of Change:</strong> Replaces baseline stepper motor actuators on joint 1 and 2 with high-precision harmonic drive servo units to eliminate 0.8mm backlash under payload conditions.
                    </p>
                    <p style={{ marginTop: '10px' }}>
                      <strong>Tooling & Inventory Impact:</strong> Current inventory of 14 units of ACT-0021 can be retrofitted or repurposed for non-precision auxiliary conveyors. Zero scrap penalty incurred.
                    </p>
                  </div>
                )}
              </div>

              {/* Odoo Signature "Chatter" Sidebar / Footer */}
              <div
                style={{
                  background: '#f8f9fa',
                  borderTop: '1px solid var(--odoo-border)',
                  padding: '20px 24px',
                }}
              >
                {/* Chatter Toolbar */}
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

                {/* Add Quick Note */}
                <form onSubmit={handleAddNote} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                  <input
                    type="text"
                    placeholder="Log an internal engineering note or comment..."
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    style={{
                      flex: 1,
                      background: '#ffffff',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      padding: '8px 12px',
                      fontSize: '0.875rem',
                    }}
                  />
                  <button type="submit" className="btn-odoo-primary" style={{ padding: '8px 16px' }}>
                    Post
                  </button>
                </form>

                {/* Audit & Activity Timeline */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {chatterMessages.map((msg) => (
                    <div key={msg.id} style={{ display: 'flex', gap: '12px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: 'var(--odoo-purple)',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                        }}
                      >
                        {msg.initials}
                      </div>
                      <div style={{ flex: 1, background: '#ffffff', border: '1px solid #e9ecef', borderRadius: '4px', padding: '10px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--odoo-text-main)' }}>
                            {msg.author}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--odoo-text-muted)' }}>
                            {msg.time}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.875rem', color: msg.type === 'status' ? 'var(--odoo-purple)' : '#495057' }}>
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

        {/* VIEW 3: MASTER DATA / PRODUCTS LIST VIEW */}
        {currentMenu === 'products' && (
          <div className="odoo-sheet" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Engineering Product Master</h2>
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
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--odoo-purple)' }}>{item.ref}</td>
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
                          background: item.status === 'Released' ? '#d4edda' : item.status === 'In Review' ? '#cce5ff' : '#fff3cd',
                          color: item.status === 'Released' ? '#155724' : item.status === 'In Review' ? '#004085' : '#856404',
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

        {/* VIEW 4: BILL OF MATERIALS TREE */}
        {currentMenu === 'bom_tree' && (
          <div className="odoo-sheet" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <span style={{ fontSize: '0.8125rem', color: 'var(--odoo-purple)', fontWeight: 600 }}>BOM-ROB-1000-01</span>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '2px' }}>
                  Bill of Materials — Autonomous Articulated Robotic Arm
                </h2>
              </div>
              <span style={{ background: '#d4edda', color: '#155724', padding: '4px 10px', borderRadius: '4px', fontSize: '0.8125rem', fontWeight: 600 }}>
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
                  <td style={{ color: 'var(--odoo-teal)', fontWeight: 600 }}>U1, U2</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* VIEW 5: CONFIGURATION / INDUSTRY PACKS */}
        {currentMenu === 'capabilities' && (
          <div className="odoo-sheet" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '6px' }}>
              Industry Capability Configuration
            </h2>
            <p style={{ color: 'var(--odoo-text-muted)', fontSize: '0.875rem', marginBottom: '20px' }}>
              Modular industry-specific BOM extensions running on the shared engineering core.
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
                        fontWeight: 600,
                        background: item.active ? '#d4edda' : '#e9ecef',
                        color: item.active ? '#155724' : '#6c757d',
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
