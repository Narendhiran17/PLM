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
  Check,
  GitCompare,
  Network,
  Sliders,
  Calendar,
  Lock,
  Unlock,
  ShieldAlert,
  KeyRound,
  Download,
  Eye,
  AlertTriangle
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
  const [currentMenu, setCurrentMenu] = useState<'ecos' | 'products' | 'bom_tree' | 'documents' | 'capabilities'>('ecos');
  const [viewMode, setViewMode] = useState<'kanban' | 'form' | 'list'>('kanban');
  const [selectedEcoId, setSelectedEcoId] = useState<string>('eco-001');
  const [formNotebookTab, setFormNotebookTab] = useState<'bom_changes' | 'approvals' | 'documents' | 'concurrency' | 'notes'>('bom_changes');
  const [activeBaselineSim, setActiveBaselineSim] = useState<'MATCH' | 'COLLISION'>('MATCH');
  const [releaseStatusAlert, setReleaseStatusAlert] = useState<{ type: 'success' | 'collision'; msg: string } | null>(null);
  const [vaultDocs, setVaultDocs] = useState([
    {
      id: 'doc-001',
      docNumber: 'DOC-SPEC-1000',
      title: 'Autonomous Articulated Robotic Arm — Master Specification',
      category: 'SPECIFICATION',
      revision: '1.0',
      status: 'RELEASED',
      file: 'ROB-1000-SPEC-v1.0.pdf',
      size: '3.1 MB',
      lockedBy: null as string | null,
    },
    {
      id: 'doc-002',
      docNumber: 'DOC-CAD-1010',
      title: 'Precision Harmonic Servo Actuator — 3D CAD Assembly',
      category: 'CAD_3D_MODEL',
      revision: '2.0',
      status: 'RELEASED',
      file: 'ROB-1010-HARMONIC.STEP',
      size: '14.8 MB',
      lockedBy: 'Marcus Vance' as string | null,
    },
    {
      id: 'doc-003',
      docNumber: 'DOC-DWG-4001',
      title: 'Multi-Axis Motor Controller PCB — Fabrication Drawing',
      category: 'DRAWING_2D',
      revision: 'A',
      status: 'RELEASED',
      file: 'PCB-4001-FAB-REV-A.pdf',
      size: '1.2 MB',
      lockedBy: null as string | null,
    },
  ]);
  const [bomSubTab, setBomSubTab] = useState<'tree' | 'compare' | 'where_used' | 'variants' | 'effectivity'>('tree');
  const [selectedWhereUsedPart, setSelectedWhereUsedPart] = useState<string>('ELC-0052');
  const [effectivityDate, setEffectivityDate] = useState<string>('2026-10-15');
  const [effectivitySerial, setEffectivitySerial] = useState<string>('SN-1500');
  const [selectedPayload, setSelectedPayload] = useState<string>('10KG');
  const [selectedIpRating, setSelectedIpRating] = useState<string>('IP54');

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

  const handleToggleDocLock = (docId: string) => {
    setVaultDocs(
      vaultDocs.map((d) => {
        if (d.id === docId) {
          const isNowLocked = !d.lockedBy;
          return {
            ...d,
            lockedBy: isNowLocked ? 'Marcus Vance' : null,
          };
        }
        return d;
      })
    );
  };

  const handleAtomicReleaseEco = () => {
    const pending = approvals.filter((a) => a.status !== 'APPROVED');
    if (pending.length > 0) {
      setReleaseStatusAlert({
        type: 'collision',
        msg: `Cannot release ECO ${activeEco.ecoNumber}: Required sign-offs pending from [${pending.map((a) => a.role).join(', ')}]`,
      });
      return;
    }

    if (activeBaselineSim === 'COLLISION') {
      setReleaseStatusAlert({
        type: 'collision',
        msg: `Baseline Concurrency Collision (INV-06): Expected baseline 'rev-001-A' has been superseded by 'rev-001-A1' from another concurrent ECO. Please re-baseline affected items before release.`,
      });
      return;
    }

    setEcos(ecos.map((e) => (e.id === activeEco.id ? { ...e, stage: 'effective' } : e)));
    setReleaseStatusAlert({
      type: 'success',
      msg: `✓ Atomic Release Succeeded: ECO ${activeEco.ecoNumber} released. Revision B baseline locked. Emitted tamper-evident audit record SHA256-${activeEco.ecoNumber}-MV.`,
    });
    setChatterMessages([
      ...chatterMessages,
      {
        id: Date.now(),
        author: 'Marcus Vance',
        initials: 'MV',
        time: 'Just now',
        type: 'status',
        content: `Atomic Release Executed: Baseline locked for Revision B. State transitioned to Effective.`,
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
                setCurrentMenu('documents');
                setViewMode('list');
              }}
              style={{
                background: currentMenu === 'documents' ? 'var(--brand-orange)' : 'transparent',
                color: currentMenu === 'documents' ? '#1E293B' : '#ffffff',
                padding: '6px 14px',
                borderRadius: '4px',
                fontWeight: currentMenu === 'documents' ? 700 : 500,
              }}
            >
              Document Vault
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
                      onClick={handleAtomicReleaseEco}
                      className="btn-odoo-primary"
                      style={{ background: 'var(--odoo-success)', color: '#ffffff' }}
                    >
                      Apply Changes & Release BOM (Atomic)
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

              {/* Release / Concurrency Alert Notification */}
              {releaseStatusAlert && (
                <div
                  style={{
                    margin: '16px 24px 0 24px',
                    padding: '12px 18px',
                    borderRadius: '6px',
                    background: releaseStatusAlert.type === 'success' ? '#ecfdf5' : '#fef2f2',
                    border: `1px solid ${releaseStatusAlert.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
                    color: releaseStatusAlert.type === 'success' ? '#065f46' : '#991b1b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                  }}
                >
                  {releaseStatusAlert.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                  <span>{releaseStatusAlert.msg}</span>
                </div>
              )}

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
                    { id: 'approvals', label: 'Approvals & E-Signatures' },
                    { id: 'documents', label: `Controlled Documents (${vaultDocs.length})` },
                    { id: 'concurrency', label: 'Concurrency Gate (INV-06)' },
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

                {/* TAB 2: APPROVALS & E-SIGNATURES */}
                {formNotebookTab === 'approvals' && (
                  <div style={{ paddingTop: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 600 }}>
                        QUORUM RULE: <span style={{ color: 'var(--brand-charcoal)', fontWeight: 700 }}>ALL_MUST_APPROVE (Unanimous Reviewers Sign-Off)</span>
                      </div>
                      <span style={{ fontSize: '0.75rem', background: '#ecfdf5', color: '#065f46', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                        21 CFR Part 11 Electronic Signature Compliant
                      </span>
                    </div>

                    <table className="odoo-table">
                      <thead>
                        <tr>
                          <th>Stage</th>
                          <th>Required Role</th>
                          <th>Assigned Approver</th>
                          <th>Status</th>
                          <th>Electronic Signature Hash</th>
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
                            <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: app.status === 'APPROVED' ? 'var(--brand-orange-hover)' : '#94a3b8' }}>
                              {app.status === 'APPROVED' ? 'HMAC-SHA256: 7f83b165...e491' : 'Pending Signature Attestation'}
                            </td>
                            <td>
                              {app.status === 'PENDING' ? (
                                <button
                                  onClick={() => handleApprove(app.id)}
                                  className="btn-odoo-primary"
                                  style={{ padding: '3px 10px', fontSize: '0.75rem' }}
                                >
                                  <Check size={12} />
                                  Approve & Sign
                                </button>
                              ) : (
                                <span style={{ color: '#10b981', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                                  <CheckCircle2 size={14} /> Attested
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* TAB 3: CONTROLLED DOCUMENTS (B01, B05) */}
                {formNotebookTab === 'documents' && (
                  <div style={{ paddingTop: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                      <span style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 600 }}>
                        ATTACHED ENGINEERING DOCUMENTS & CAD ARTIFACTS
                      </span>
                      <button className="btn-odoo-secondary" style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
                        <Plus size={12} /> Attach Document
                      </button>
                    </div>

                    <table className="odoo-table">
                      <thead>
                        <tr>
                          <th>Document No</th>
                          <th>Title</th>
                          <th>Category</th>
                          <th>Revision</th>
                          <th>File Artifact</th>
                          <th>Check-Out Lock (B05)</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vaultDocs.map((doc) => (
                          <tr key={doc.id}>
                            <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--brand-orange-hover)' }}>
                              {doc.docNumber}
                            </td>
                            <td style={{ fontWeight: 600 }}>{doc.title}</td>
                            <td>
                              <span style={{ background: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: '3px', fontSize: '0.75rem', fontWeight: 600 }}>
                                {doc.category}
                              </span>
                            </td>
                            <td>Rev {doc.revision}</td>
                            <td>
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>{doc.file}</span>{' '}
                              <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>({doc.size})</span>
                            </td>
                            <td>
                              {doc.lockedBy ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#fee2e2', color: '#991b1b', padding: '2px 8px', borderRadius: '3px', fontSize: '0.75rem', fontWeight: 700 }}>
                                  <Lock size={12} /> Locked by {doc.lockedBy}
                                </span>
                              ) : (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '3px', fontSize: '0.75rem', fontWeight: 600 }}>
                                  <Unlock size={12} /> Available (Unlocked)
                                </span>
                              )}
                            </td>
                            <td>
                              <button
                                onClick={() => handleToggleDocLock(doc.id)}
                                style={{
                                  background: doc.lockedBy ? '#f1f5f9' : 'var(--brand-charcoal)',
                                  color: doc.lockedBy ? '#334155' : 'var(--brand-orange)',
                                  border: '1px solid #cbd5e1',
                                  padding: '4px 10px',
                                  borderRadius: '4px',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                {doc.lockedBy ? <Unlock size={12} /> : <Lock size={12} />}
                                {doc.lockedBy ? 'Check In (Unlock)' : 'Check Out (Lock)'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* TAB 4: CONCURRENCY & RELEASE GATE (INV-06) */}
                {formNotebookTab === 'concurrency' && (
                  <div style={{ paddingTop: '16px' }}>
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '16px', marginBottom: '16px' }}>
                      <div style={{ fontSize: '0.8125rem', color: '#475569', fontWeight: 700, marginBottom: '6px' }}>
                        INVARIANT 6: CONCURRENCY COLLISION PREVENTION ENGINE
                      </div>
                      <p style={{ fontSize: '0.8125rem', color: '#64748b', lineHeight: '1.5', marginBottom: '14px' }}>
                        The Universal PLM engine guarantees that no ECO can release changes on top of a superseded or stale baseline.
                        Toggle the test scenario below to observe how the release command behaves.
                      </p>

                      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}>
                          <input
                            type="radio"
                            name="concurrencySim"
                            checked={activeBaselineSim === 'MATCH'}
                            onChange={() => setActiveBaselineSim('MATCH')}
                          />
                          <span>✓ Clean Baseline (Expected rev-001-A == Active Database rev-001-A)</span>
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, color: '#dc2626' }}>
                          <input
                            type="radio"
                            name="concurrencySim"
                            checked={activeBaselineSim === 'COLLISION'}
                            onChange={() => setActiveBaselineSim('COLLISION')}
                          />
                          <span>⚠️ Stale Collision Simulation (Database has rev-001-A1 from concurrent ECO)</span>
                        </label>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '16px' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--brand-charcoal)' }}>
                          Atomic Release Command Verification
                        </div>
                        <div style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '2px' }}>
                          Validates all sign-offs, checks baseline concurrency, locks revisions (INV-03), and logs audit signature (INV-05).
                        </div>
                      </div>

                      <button
                        onClick={handleAtomicReleaseEco}
                        className="btn-odoo-primary"
                        style={{ padding: '8px 18px', fontSize: '0.875rem' }}
                      >
                        Execute Atomic Release
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 5: NOTES */}
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

        {/* VIEW 4: BOM & ENGINEERING WORKBENCH */}
        {currentMenu === 'bom_tree' && (
          <div className="odoo-sheet" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '0.8125rem', color: 'var(--brand-orange-hover)', fontWeight: 700 }}>
                  BOM-ROB-1000 · Autonomous Articulated Robotic Arm
                </span>
                <h2 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--brand-charcoal)', marginTop: '2px' }}>
                  Engineering Bill of Materials & Lineage Workbench
                </h2>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', padding: '4px 10px', borderRadius: '4px', fontSize: '0.8125rem', fontWeight: 700 }}>
                  ✓ Cycle-Safe Verified (DFS)
                </span>
                <span style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', padding: '4px 10px', borderRadius: '4px', fontSize: '0.8125rem', fontWeight: 700 }}>
                  Phase 1 Engineering Core
                </span>
              </div>
            </div>

            {/* Subtab Navigation */}
            <div style={{ display: 'flex', gap: '4px', borderBottom: '2px solid #e2e8f0', marginBottom: '20px' }}>
              {[
                { id: 'tree', label: 'Multi-Level Tree', icon: Layers },
                { id: 'compare', label: 'BOM Redline Diff (A13)', icon: GitCompare },
                { id: 'where_used', label: 'Deep Where-Used (A06)', icon: Network },
                { id: 'variants', label: 'Product Variants (A02)', icon: Sliders },
                { id: 'effectivity', label: 'Effectivity Rules (A12)', icon: Calendar },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = bomSubTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setBomSubTab(tab.id as any)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 16px',
                      background: isActive ? 'var(--brand-charcoal)' : 'transparent',
                      color: isActive ? 'var(--brand-orange)' : '#64748b',
                      fontWeight: isActive ? 700 : 500,
                      borderRadius: '4px 4px 0 0',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Icon size={16} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* SUBTAB 1: MULTI-LEVEL BOM TREE */}
            {bomSubTab === 'tree' && (
              <div>
                <table className="odoo-table">
                  <thead>
                    <tr>
                      <th style={{ width: '80px' }}>Level</th>
                      <th>Component Name</th>
                      <th>Part Number</th>
                      <th>Revision</th>
                      <th>Quantity</th>
                      <th>UOM</th>
                      <th>Reference Designators</th>
                      <th>Lifecycle</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>0</strong></td>
                      <td style={{ fontWeight: 700, color: 'var(--brand-charcoal)' }}>Autonomous Articulated Robotic Arm</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>ROB-1000</td>
                      <td>Rev A</td>
                      <td>1.0</td>
                      <td>EA</td>
                      <td>—</td>
                      <td><span style={{ background: '#d1fae5', color: '#065f46', padding: '2px 6px', borderRadius: '3px', fontSize: '0.75rem', fontWeight: 600 }}>RELEASED</span></td>
                    </tr>
                    <tr>
                      <td style={{ paddingLeft: '24px' }}>├── 1.1</td>
                      <td style={{ fontWeight: 600 }}>Precision Harmonic Servo Actuator</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>ROB-1010</td>
                      <td>Rev B</td>
                      <td style={{ fontWeight: 600 }}>6.0</td>
                      <td>EA</td>
                      <td>Joints 1–6</td>
                      <td><span style={{ background: '#d1fae5', color: '#065f46', padding: '2px 6px', borderRadius: '3px', fontSize: '0.75rem', fontWeight: 600 }}>RELEASED</span></td>
                    </tr>
                    <tr>
                      <td style={{ paddingLeft: '24px' }}>├── 1.2</td>
                      <td style={{ fontWeight: 600 }}>Multi-Axis Motor Controller PCB</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>PCB-4001</td>
                      <td>Rev A</td>
                      <td style={{ fontWeight: 600 }}>1.0</td>
                      <td>EA</td>
                      <td>Main Bay</td>
                      <td><span style={{ background: '#d1fae5', color: '#065f46', padding: '2px 6px', borderRadius: '3px', fontSize: '0.75rem', fontWeight: 600 }}>RELEASED</span></td>
                    </tr>
                    <tr>
                      <td style={{ paddingLeft: '48px' }}>└── 2.1</td>
                      <td>CAN-Bus Transceiver IC (AEC-Q100)</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>ELC-0052</td>
                      <td>Rev A</td>
                      <td>2.0</td>
                      <td>EA</td>
                      <td><span style={{ color: 'var(--brand-orange-hover)', fontWeight: 700 }}>U1, U2</span></td>
                      <td><span style={{ background: '#d1fae5', color: '#065f46', padding: '2px 6px', borderRadius: '3px', fontSize: '0.75rem', fontWeight: 600 }}>RELEASED</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* SUBTAB 2: BOM REDLINE DIFF (A13) */}
            {bomSubTab === 'compare' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '6px', padding: '12px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#065f46', fontWeight: 600 }}>ADDED COMPONENTS</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#065f46' }}>+1</div>
                    <div style={{ fontSize: '0.75rem', color: '#047857' }}>ROB-1010 Servo Actuator</div>
                  </div>
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '12px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#991b1b', fontWeight: 600 }}>REMOVED COMPONENTS</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#991b1b' }}>-1</div>
                    <div style={{ fontSize: '0.75rem', color: '#b91c1c' }}>ACT-0021 Stepper Motor</div>
                  </div>
                  <div style={{ background: '#fefce8', border: '1px solid #fef08a', borderRadius: '6px', padding: '12px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#854d0e', fontWeight: 600 }}>MODIFIED COMPONENTS</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#854d0e' }}>~1</div>
                    <div style={{ fontSize: '0.75rem', color: '#a16207' }}>MNT-0902 M6 Bolts (Qty 12➔16)</div>
                  </div>
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 600 }}>UNCHANGED COMPONENTS</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#475569' }}>1</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>PCB-4001 Motor Controller</div>
                  </div>
                </div>

                <table className="odoo-table">
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Part Number</th>
                      <th>Description</th>
                      <th>Old Qty</th>
                      <th>New Qty</th>
                      <th>Delta</th>
                      <th>Find No</th>
                      <th>Engineering Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ background: '#f0fdf4' }}>
                      <td>
                        <span style={{ background: '#16a34a', color: '#ffffff', padding: '2px 8px', borderRadius: '3px', fontSize: '0.75rem', fontWeight: 700 }}>
                          ADDED
                        </span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>ROB-1010</td>
                      <td>Precision Harmonic Servo Actuator</td>
                      <td>0.0</td>
                      <td style={{ fontWeight: 700, color: '#16a34a' }}>6.0</td>
                      <td style={{ fontWeight: 700, color: '#16a34a' }}>+6.0</td>
                      <td>10</td>
                      <td>Upgrades joint torque from 25Nm to 65Nm</td>
                    </tr>
                    <tr style={{ background: '#fef2f2' }}>
                      <td>
                        <span style={{ background: '#dc2626', color: '#ffffff', padding: '2px 8px', borderRadius: '3px', fontSize: '0.75rem', fontWeight: 700 }}>
                          REMOVED
                        </span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>ACT-0021</td>
                      <td>Legacy NEMA-23 Stepper Motor</td>
                      <td style={{ textDecoration: 'line-through' }}>6.0</td>
                      <td>0.0</td>
                      <td style={{ fontWeight: 700, color: '#dc2626' }}>-6.0</td>
                      <td>10</td>
                      <td>Obsolescence replacement in ECO-2026-0042</td>
                    </tr>
                    <tr style={{ background: '#fefce8' }}>
                      <td>
                        <span style={{ background: '#ca8a04', color: '#ffffff', padding: '2px 8px', borderRadius: '3px', fontSize: '0.75rem', fontWeight: 700 }}>
                          MODIFIED
                        </span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>MNT-0902</td>
                      <td>Grade 10.9 M6 Hex Flange Bolts</td>
                      <td>12.0</td>
                      <td style={{ fontWeight: 700, color: '#ca8a04' }}>16.0</td>
                      <td style={{ fontWeight: 700, color: '#ca8a04' }}>+4.0</td>
                      <td>30</td>
                      <td>4 additional mounting bolts for heavier flange</td>
                    </tr>
                    <tr>
                      <td>
                        <span style={{ background: '#e2e8f0', color: '#475569', padding: '2px 8px', borderRadius: '3px', fontSize: '0.75rem', fontWeight: 600 }}>
                          UNCHANGED
                        </span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>PCB-4001</td>
                      <td>Multi-Axis Motor Controller PCB</td>
                      <td>1.0</td>
                      <td>1.0</td>
                      <td>0.0</td>
                      <td>20</td>
                      <td>Pin-compatible harness interface verified</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* SUBTAB 3: DEEP WHERE-USED (A06) */}
            {bomSubTab === 'where_used' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--brand-charcoal)' }}>
                    Select Child Component to Trace Impact:
                  </label>
                  <select
                    value={selectedWhereUsedPart}
                    onChange={(e) => setSelectedWhereUsedPart(e.target.value)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '4px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      background: '#ffffff',
                    }}
                  >
                    <option value="ELC-0052">ELC-0052 — CAN-Bus Transceiver IC</option>
                    <option value="PCB-4001">PCB-4001 — Multi-Axis Motor Controller PCB</option>
                    <option value="ROB-1010">ROB-1010 — Precision Harmonic Servo Actuator</option>
                  </select>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '16px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>
                    BOTTOM-UP EXPLOSION HIERARCHY
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9375rem', fontWeight: 600 }}>
                    <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '4px 10px', borderRadius: '4px', fontFamily: 'var(--font-mono)' }}>
                      {selectedWhereUsedPart}
                    </span>
                    <span style={{ color: '#94a3b8' }}>➔</span>
                    {selectedWhereUsedPart === 'ELC-0052' && (
                      <>
                        <span style={{ background: '#fef3c7', color: '#92400e', padding: '4px 10px', borderRadius: '4px', fontFamily: 'var(--font-mono)' }}>
                          PCB-4001 (Level 1 Parent)
                        </span>
                        <span style={{ color: '#94a3b8' }}>➔</span>
                      </>
                    )}
                    <span style={{ background: '#ecfdf5', color: '#065f46', padding: '4px 10px', borderRadius: '4px', fontFamily: 'var(--font-mono)' }}>
                      ROB-1000 (Top-Level Assembly)
                    </span>
                  </div>
                </div>

                <table className="odoo-table">
                  <thead>
                    <tr>
                      <th>Impact Level</th>
                      <th>Parent Assembly</th>
                      <th>Part Number</th>
                      <th>Parent Revision</th>
                      <th>Qty Consumed</th>
                      <th>BOM Type</th>
                      <th>Assembly State</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedWhereUsedPart === 'ELC-0052' && (
                      <tr>
                        <td><strong>Level 1</strong> (Direct)</td>
                        <td style={{ fontWeight: 600 }}>Multi-Axis Motor Controller PCB</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>PCB-4001</td>
                        <td>Rev A</td>
                        <td>2.0 EA</td>
                        <td>EBOM</td>
                        <td><span style={{ background: '#d1fae5', color: '#065f46', padding: '2px 6px', borderRadius: '3px', fontSize: '0.75rem', fontWeight: 600 }}>RELEASED</span></td>
                      </tr>
                    )}
                    <tr>
                      <td><strong>{selectedWhereUsedPart === 'ELC-0052' ? 'Level 2' : 'Level 1'}</strong> (Top)</td>
                      <td style={{ fontWeight: 600 }}>Autonomous Articulated Robotic Arm</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>ROB-1000</td>
                      <td>Rev A</td>
                      <td>{selectedWhereUsedPart === 'ROB-1010' ? '6.0 EA' : '1.0 EA'}</td>
                      <td>EBOM</td>
                      <td><span style={{ background: '#d1fae5', color: '#065f46', padding: '2px 6px', borderRadius: '3px', fontSize: '0.75rem', fontWeight: 600 }}>RELEASED</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* SUBTAB 4: PRODUCT VARIANTS (A02) */}
            {bomSubTab === 'variants' && (
              <div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '16px', marginBottom: '20px' }}>
                  <div style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>
                    FAMILY: ROB-FAMILY · Articulated Industrial Robot Series
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div>
                      <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--brand-charcoal)', display: 'block', marginBottom: '6px' }}>
                        Payload Capacity Option:
                      </label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {[
                          { code: '10KG', label: '10 kg High Speed' },
                          { code: '20KG', label: '20 kg Standard' },
                          { code: '50KG', label: '50 kg Heavy Duty' },
                        ].map((opt) => (
                          <button
                            key={opt.code}
                            onClick={() => setSelectedPayload(opt.code)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '4px',
                              border: selectedPayload === opt.code ? '2px solid var(--brand-orange)' : '1px solid #cbd5e1',
                              background: selectedPayload === opt.code ? '#fffbeb' : '#ffffff',
                              color: selectedPayload === opt.code ? '#92400e' : '#334155',
                              fontWeight: selectedPayload === opt.code ? 700 : 500,
                              cursor: 'pointer',
                              fontSize: '0.8125rem',
                            }}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--brand-charcoal)', display: 'block', marginBottom: '6px' }}>
                        Environmental Protection Option:
                      </label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {[
                          { code: 'IP54', label: 'IP54 Workshop Standard' },
                          { code: 'IP67', label: 'IP67 Cleanroom / Washdown' },
                        ].map((opt) => (
                          <button
                            key={opt.code}
                            onClick={() => setSelectedIpRating(opt.code)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '4px',
                              border: selectedIpRating === opt.code ? '2px solid var(--brand-orange)' : '1px solid #cbd5e1',
                              background: selectedIpRating === opt.code ? '#fffbeb' : '#ffffff',
                              color: selectedIpRating === opt.code ? '#92400e' : '#334155',
                              fontWeight: selectedIpRating === opt.code ? 700 : 500,
                              cursor: 'pointer',
                              fontSize: '0.8125rem',
                            }}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '16px' }}>
                  <div style={{ fontSize: '0.8125rem', color: '#166534', fontWeight: 600 }}>RESOLVED CONFIGURED VARIANT SKU</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#166534', fontFamily: 'var(--font-mono)' }}>
                      ROB-1000-{selectedPayload}-{selectedIpRating}
                    </div>
                    <span style={{ background: '#dcfce7', color: '#15803d', padding: '4px 10px', borderRadius: '4px', fontWeight: 700, fontSize: '0.8125rem' }}>
                      Configured BOM Active
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* SUBTAB 5: EFFECTIVITY RULES (A12) */}
            {bomSubTab === 'effectivity' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '16px' }}>
                    <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--brand-charcoal)', display: 'block', marginBottom: '8px' }}>
                      Simulate Production Build Date:
                    </label>
                    <input
                      type="date"
                      value={effectivityDate}
                      onChange={(e) => setEffectivityDate(e.target.value)}
                      style={{
                        padding: '6px 12px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px',
                        fontSize: '0.875rem',
                        width: '100%',
                      }}
                    />
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '6px' }}>
                      Date effectivity filters out lines not valid during this assembly run.
                    </div>
                  </div>

                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '16px' }}>
                    <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--brand-charcoal)', display: 'block', marginBottom: '8px' }}>
                      Simulate Production Unit Serial Number:
                    </label>
                    <input
                      type="text"
                      value={effectivitySerial}
                      onChange={(e) => setEffectivitySerial(e.target.value)}
                      placeholder="e.g. SN-1500"
                      style={{
                        padding: '6px 12px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px',
                        fontSize: '0.875rem',
                        width: '100%',
                      }}
                    />
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '6px' }}>
                      Serial effectivity applies cut-in changes from SN-1000 through SN-2000.
                    </div>
                  </div>
                </div>

                <table className="odoo-table">
                  <thead>
                    <tr>
                      <th>Component</th>
                      <th>Effectivity Type</th>
                      <th>Rule Window</th>
                      <th>Status at Production Run</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ fontWeight: 600 }}>Precision Harmonic Servo (ROB-1010)</td>
                      <td>DATE EFFECTIVITY</td>
                      <td>Valid From 2026-01-01 to 2026-12-31</td>
                      <td>
                        <span style={{ background: '#d1fae5', color: '#065f46', padding: '2px 8px', borderRadius: '3px', fontSize: '0.75rem', fontWeight: 700 }}>
                          ✓ ACTIVE (Included in Build)
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600 }}>CAN-Bus AEC-Q100 IC (ELC-0052)</td>
                      <td>SERIAL EFFECTIVITY</td>
                      <td>Valid Units SN-1000 to SN-2000</td>
                      <td>
                        <span style={{ background: effectivitySerial >= 'SN-1000' && effectivitySerial <= 'SN-2000' ? '#d1fae5' : '#fee2e2', color: effectivitySerial >= 'SN-1000' && effectivitySerial <= 'SN-2000' ? '#065f46' : '#991b1b', padding: '2px 8px', borderRadius: '3px', fontSize: '0.75rem', fontWeight: 700 }}>
                          {effectivitySerial >= 'SN-1000' && effectivitySerial <= 'SN-2000' ? '✓ ACTIVE (Included in Build)' : '✕ INACTIVE (Cut-in Not Reached)'}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* VIEW 5: CONTROLLED DOCUMENT VAULT (B01, B05) */}
        {currentMenu === 'documents' && (
          <div className="odoo-sheet" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '0.8125rem', color: 'var(--brand-orange-hover)', fontWeight: 700 }}>
                  SECURE REPOSITORY · CATALYST STRATUS OBJECT STORAGE
                </span>
                <h2 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--brand-charcoal)', marginTop: '2px' }}>
                  Controlled Document Vault & CAD Artifacts
                </h2>
              </div>
              <button className="btn-odoo-primary">
                <Plus size={14} /> New Document
              </button>
            </div>

            <p style={{ color: 'var(--odoo-text-muted)', fontSize: '0.875rem', marginBottom: '20px' }}>
              Immutable version control (Rev 1.0, 2.0), CAD 3D models (STEP/SolidWorks), technical drawings, and exclusive check-in / check-out locking (B01, B05).
            </p>

            <table className="odoo-table">
              <thead>
                <tr>
                  <th>Document Number</th>
                  <th>Title & Description</th>
                  <th>Category</th>
                  <th>Active Revision</th>
                  <th>File Artifact</th>
                  <th>Size</th>
                  <th>Check-Out Lock Status (B05)</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {vaultDocs.map((doc) => (
                  <tr key={doc.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--brand-orange-hover)' }}>
                      {doc.docNumber}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{doc.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--odoo-text-muted)', marginTop: '2px' }}>
                        Linked to ROB-1000 Assembly & Subsystems
                      </div>
                    </td>
                    <td>
                      <span style={{ background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '3px', fontSize: '0.75rem', fontWeight: 600 }}>
                        {doc.category}
                      </span>
                    </td>
                    <td>
                      <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '3px', fontSize: '0.75rem', fontWeight: 700 }}>
                        Rev {doc.revision}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>{doc.file}</td>
                    <td>{doc.size}</td>
                    <td>
                      {doc.lockedBy ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#fee2e2', color: '#991b1b', padding: '2px 8px', borderRadius: '3px', fontSize: '0.75rem', fontWeight: 700 }}>
                          <Lock size={12} /> Locked by {doc.lockedBy}
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '3px', fontSize: '0.75rem', fontWeight: 600 }}>
                          <Unlock size={12} /> Available (Unlocked)
                        </span>
                      )}
                    </td>
                    <td>
                      <button
                        onClick={() => handleToggleDocLock(doc.id)}
                        style={{
                          background: doc.lockedBy ? '#f1f5f9' : 'var(--brand-charcoal)',
                          color: doc.lockedBy ? '#334155' : 'var(--brand-orange)',
                          border: '1px solid #cbd5e1',
                          padding: '4px 10px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        {doc.lockedBy ? <Unlock size={12} /> : <Lock size={12} />}
                        {doc.lockedBy ? 'Check In (Unlock)' : 'Check Out (Lock)'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* VIEW 6: CONFIGURATION */}
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
