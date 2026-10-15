import React, { useState } from 'react';
import {
  Boxes,
  GitBranch,
  Layers,
  FileText,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Search,
  ChevronRight,
  ChevronDown,
  Cpu,
  ShieldCheck,
  Server,
  Cloud,
  Clock,
  ArrowRight
} from 'lucide-react';

interface PartItem {
  id: string;
  partNumber: string;
  name: string;
  type: string;
  revision: string;
  lifecycleState: 'RELEASED' | 'DRAFT' | 'IN_REVIEW' | 'OBSOLETE';
  uom: string;
  lastUpdated: string;
}

interface BomTreeNode {
  id: string;
  level: number;
  partNumber: string;
  name: string;
  revision: string;
  quantity: number;
  uom: string;
  findNumber: number;
  refDes?: string[];
  expanded?: boolean;
  children?: BomTreeNode[];
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'parts' | 'bom' | 'eco' | 'capabilities' | 'infra'>('parts');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [showNewPartModal, setShowNewPartModal] = useState(false);

  // Sample initial state for Parts
  const [parts, setParts] = useState<PartItem[]>([
    {
      id: 'p-1',
      partNumber: 'ROB-1000',
      name: 'Autonomous Articulated Robotic Arm',
      type: 'ASSEMBLY',
      revision: 'A',
      lifecycleState: 'RELEASED',
      uom: 'EA',
      lastUpdated: '2 hours ago',
    },
    {
      id: 'p-2',
      partNumber: 'ROB-1010',
      name: 'Precision Harmonic Servo Actuator',
      type: 'MANUFACTURED',
      revision: 'B',
      lifecycleState: 'RELEASED',
      uom: 'EA',
      lastUpdated: '1 day ago',
    },
    {
      id: 'p-3',
      partNumber: 'PCB-4001',
      name: 'Multi-Axis Motor Controller PCB',
      type: 'ASSEMBLY',
      revision: 'A',
      lifecycleState: 'RELEASED',
      uom: 'EA',
      lastUpdated: '3 days ago',
    },
    {
      id: 'p-4',
      partNumber: 'ELC-0052',
      name: 'CAN-Bus Transceiver IC (AEC-Q100)',
      type: 'PURCHASED',
      revision: 'A',
      lifecycleState: 'RELEASED',
      uom: 'EA',
      lastUpdated: '5 days ago',
    },
    {
      id: 'p-5',
      partNumber: 'FRM-9002',
      name: 'Embedded RTOS Motor Firmware',
      type: 'SOFTWARE',
      revision: '1.2.0',
      lifecycleState: 'DRAFT',
      uom: 'EA',
      lastUpdated: 'Just now',
    },
  ]);

  // Form state for creating a new part
  const [newPartNumber, setNewPartNumber] = useState('');
  const [newPartName, setNewPartName] = useState('');
  const [newPartType, setNewPartType] = useState('MANUFACTURED');
  const [newPartUom, setNewPartUom] = useState('EA');

  // Interactive Multi-Level BOM Tree
  const [bomTree, setBomTree] = useState<BomTreeNode>({
    id: 'tree-root',
    level: 0,
    partNumber: 'ROB-1000',
    name: 'Autonomous Articulated Robotic Arm',
    revision: 'A',
    quantity: 1,
    uom: 'EA',
    findNumber: 0,
    expanded: true,
    children: [
      {
        id: 'tree-node-1',
        level: 1,
        partNumber: 'ROB-1010',
        name: 'Precision Harmonic Servo Actuator',
        revision: 'B',
        quantity: 6,
        uom: 'EA',
        findNumber: 10,
        expanded: false,
        children: [],
      },
      {
        id: 'tree-node-2',
        level: 1,
        partNumber: 'PCB-4001',
        name: 'Multi-Axis Motor Controller PCB',
        revision: 'A',
        quantity: 1,
        uom: 'EA',
        findNumber: 20,
        expanded: true,
        children: [
          {
            id: 'tree-node-3',
            level: 2,
            partNumber: 'ELC-0052',
            name: 'CAN-Bus Transceiver IC',
            revision: 'A',
            quantity: 2,
            uom: 'EA',
            findNumber: 10,
            refDes: ['U1', 'U2'],
            children: [],
          },
        ],
      },
    ],
  });

  // ECO State
  const [ecoApproved, setEcoApproved] = useState(false);

  const handleCreatePart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartName) return;

    const created: PartItem = {
      id: `p-${Date.now()}`,
      partNumber: newPartNumber || `PRT-${Math.floor(1000 + Math.random() * 9000)}`,
      name: newPartName,
      type: newPartType,
      revision: 'A',
      lifecycleState: 'DRAFT',
      uom: newPartUom,
      lastUpdated: 'Just now',
    };

    setParts([created, ...parts]);
    setNewPartNumber('');
    setNewPartName('');
    setShowNewPartModal(false);
  };

  const filteredParts = parts.filter((p) => {
    const matchesSearch =
      p.partNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'ALL' || p.type === filterType;
    return matchesSearch && matchesType;
  });

  const toggleNodeExpansion = (nodeId: string) => {
    const toggleInTree = (node: BomTreeNode): BomTreeNode => {
      if (node.id === nodeId) {
        return { ...node, expanded: !node.expanded };
      }
      if (node.children) {
        return { ...node, children: node.children.map(toggleInTree) };
      }
      return node;
    };
    setBomTree(toggleInTree(bomTree));
  };

  const renderBomNode = (node: BomTreeNode) => {
    const hasChildren = node.children && node.children.length > 0;
    return (
      <div key={node.id} style={{ marginLeft: `${node.level * 28}px`, marginBottom: '8px' }}>
        <div
          className="glass-panel"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderLeft: node.level === 0 ? '3px solid var(--accent-sky)' : node.level === 1 ? '3px solid var(--accent-indigo)' : '3px solid var(--accent-emerald)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {hasChildren ? (
              <button
                onClick={() => toggleNodeExpansion(node.id)}
                style={{
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {node.expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              </button>
            ) : (
              <div style={{ width: '18px' }} />
            )}

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="mono-badge" style={{ color: 'var(--accent-sky)', fontWeight: 600 }}>
                  {node.partNumber}
                </span>
                <span style={{ fontSize: '0.75rem', background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: '4px' }}>
                  Rev {node.revision}
                </span>
                {node.refDes && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent-amber)', background: 'rgba(245, 158, 11, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                    Ref: {node.refDes.join(', ')}
                  </span>
                )}
              </div>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {node.name}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {node.findNumber > 0 && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Find #</div>
                <div className="mono-badge" style={{ color: 'var(--text-secondary)' }}>{node.findNumber}</div>
              </div>
            )}
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Quantity</div>
              <div className="mono-badge" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {node.quantity} {node.uom}
              </div>
            </div>
          </div>
        </div>

        {hasChildren && node.expanded && (
          <div style={{ marginTop: '8px' }}>
            {node.children!.map((child) => renderBomNode(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Top Application Bar */}
      <header
        style={{
          borderBottom: '1px solid var(--border-color)',
          background: 'rgba(10, 14, 23, 0.85)',
          backdropFilter: 'blur(12px)',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          padding: '0 24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, var(--accent-sky), var(--accent-indigo))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-glow)',
              }}
            >
              <Layers size={20} color="#fff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 700, fontSize: '1.125rem', letterSpacing: '-0.02em' }}>
                  Universal PLM
                </span>
                <span
                  style={{
                    fontSize: '0.7rem',
                    background: 'rgba(56, 189, 248, 0.15)',
                    color: 'var(--accent-sky)',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontWeight: 600,
                  }}
                >
                  Zoho Catalyst AppSail + Slate
                </span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Configurable Engineering Core · Multi-Industry
              </span>
            </div>
          </div>

          {/* Tenant & Session Context */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.8125rem',
              }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-emerald)' }}></span>
              <span style={{ color: 'var(--text-muted)' }}>Tenant:</span>
              <span style={{ fontWeight: 600 }}>Acme Robotics Corp</span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.8125rem',
              }}
            >
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'var(--accent-indigo)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                }}
              >
                MV
              </div>
              <span style={{ fontWeight: 500 }}>Marcus Vance (Lead Engineer)</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
          {[
            { id: 'parts', label: 'Part Master', icon: Boxes },
            { id: 'bom', label: 'BOM Explorer', icon: GitBranch },
            { id: 'eco', label: 'Engineering Changes', icon: FileText },
            { id: 'capabilities', label: 'Industry Capabilities', icon: Sliders },
            { id: 'infra', label: 'Catalyst Architecture', icon: Server },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  borderBottom: isActive ? '2px solid var(--accent-sky)' : '2px solid transparent',
                  background: 'transparent',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: isActive ? 600 : 400,
                  fontSize: '0.875rem',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={16} color={isActive ? 'var(--accent-sky)' : 'currentColor'} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Workspace Area */}
      <main style={{ flex: 1, padding: '24px', maxWidth: '1440px', width: '100%', margin: '0 auto' }}>
        {/* TAB 1: PART MASTER */}
        {activeTab === 'parts' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Part Master</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '4px' }}>
                  Universal engineering part definitions, revisions, and lifecycle baselines.
                </p>
              </div>

              <button
                onClick={() => setShowNewPartModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, var(--accent-sky), var(--accent-blue))',
                  color: '#fff',
                  padding: '10px 18px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  boxShadow: 'var(--shadow-md)',
                }}
              >
                <Plus size={16} />
                New Part
              </button>
            </div>

            {/* Filter Bar */}
            <div
              className="glass-panel"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                <Search size={18} color="var(--text-muted)" />
                <input
                  type="text"
                  placeholder="Search by part number, name, or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-primary)',
                    width: '100%',
                    fontSize: '0.875rem',
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Type:</span>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  style={{
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '0.8125rem',
                  }}
                >
                  <option value="ALL">All Types</option>
                  <option value="ASSEMBLY">Assemblies</option>
                  <option value="MANUFACTURED">Manufactured</option>
                  <option value="PURCHASED">Purchased</option>
                  <option value="SOFTWARE">Software</option>
                </select>
              </div>
            </div>

            {/* Parts Table */}
            <div className="glass-panel" style={{ overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '14px 20px' }}>Part Number</th>
                    <th style={{ padding: '14px 20px' }}>Name</th>
                    <th style={{ padding: '14px 20px' }}>Type</th>
                    <th style={{ padding: '14px 20px' }}>Revision</th>
                    <th style={{ padding: '14px 20px' }}>Lifecycle State</th>
                    <th style={{ padding: '14px 20px' }}>UOM</th>
                    <th style={{ padding: '14px 20px' }}>Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredParts.map((part) => (
                    <tr
                      key={part.id}
                      style={{
                        borderBottom: '1px solid rgba(148, 163, 184, 0.06)',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '16px 20px' }}>
                        <span className="mono-badge" style={{ fontWeight: 600, color: 'var(--accent-sky)' }}>
                          {part.partNumber}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px', fontWeight: 500 }}>{part.name}</td>
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{ fontSize: '0.75rem', background: 'var(--bg-tertiary)', padding: '3px 8px', borderRadius: '4px', color: 'var(--text-secondary)' }}>
                          {part.type}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <span className="mono-badge" style={{ color: 'var(--text-secondary)' }}>Rev {part.revision}</span>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            padding: '3px 10px',
                            borderRadius: '12px',
                            fontWeight: 600,
                            background:
                              part.lifecycleState === 'RELEASED'
                                ? 'rgba(16, 185, 129, 0.15)'
                                : 'rgba(245, 158, 11, 0.15)',
                            color:
                              part.lifecycleState === 'RELEASED'
                                ? 'var(--accent-emerald)'
                                : 'var(--accent-amber)',
                          }}
                        >
                          {part.lifecycleState}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>{part.uom}</td>
                      <td style={{ padding: '16px 20px', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>{part.lastUpdated}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: BOM EXPLORER */}
        {activeTab === 'bom' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Multi-Level BOM Explorer</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '4px' }}>
                  Cycle-safe recursive explosion with quantity accumulation and reference designators.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.75rem',
                    background: 'rgba(16, 185, 129, 0.1)',
                    color: 'var(--accent-emerald)',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                  }}
                >
                  <ShieldCheck size={14} />
                  Cycle Detector: Active (Invariant 7 Validated)
                </span>
              </div>
            </div>

            <div style={{ marginTop: '12px' }}>
              {renderBomNode(bomTree)}
            </div>
          </div>
        )}

        {/* TAB 3: ENGINEERING CHANGES (ECO) */}
        {activeTab === 'eco' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Engineering Change Management</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '4px' }}>
                Rigorous change workflow with impact analysis, redlines, and immutable release evidence.
              </p>
            </div>

            {/* Active ECO Card */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="mono-badge" style={{ color: 'var(--accent-sky)', fontSize: '1rem', fontWeight: 700 }}>
                      ECO-2026-0042
                    </span>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        padding: '3px 10px',
                        borderRadius: '12px',
                        fontWeight: 600,
                        background: ecoApproved ? 'rgba(16, 185, 129, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                        color: ecoApproved ? 'var(--accent-emerald)' : 'var(--accent-sky)',
                      }}
                    >
                      {ecoApproved ? 'APPROVED & READY TO RELEASE' : 'IN APPROVAL STAGE'}
                    </span>
                  </div>
                  <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginTop: '6px' }}>
                    Release Robotic Arm Revision B with upgraded Harmonic Actuators
                  </h2>
                </div>

                {!ecoApproved ? (
                  <button
                    onClick={() => setEcoApproved(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: 'linear-gradient(135deg, var(--accent-emerald), #059669)',
                      color: '#fff',
                      padding: '10px 20px',
                      borderRadius: '8px',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      boxShadow: 'var(--shadow-md)',
                    }}
                  >
                    <CheckCircle2 size={16} />
                    Cast Approval Vote
                  </button>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-emerald)', fontWeight: 600 }}>
                    <CheckCircle2 size={18} />
                    Approval Signed
                  </div>
                )}
              </div>

              {/* Impact Analysis Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', margin: '20px 0' }}>
                <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Affected Assemblies</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '4px', color: 'var(--text-primary)' }}>1 Assembly</div>
                </div>
                <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Open Purchase Orders</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '4px', color: 'var(--accent-amber)' }}>4 Orders</div>
                </div>
                <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Estimated Scrap Risk</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '4px', color: 'var(--accent-rose)' }}>$1,250.00</div>
                </div>
                <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Required Rework Time</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '4px', color: 'var(--accent-sky)' }}>8.5 Hours</div>
                </div>
              </div>

              {/* Approval Stages */}
              <div>
                <h3 style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px' }}>
                  Approval Voting Matrix
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <CheckCircle2 size={16} color="var(--accent-emerald)" />
                      <span>Stage 1: Lead Engineering Validation (Marcus Vance)</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)' }}>APPROVED (Verified load models)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {ecoApproved ? <CheckCircle2 size={16} color="var(--accent-emerald)" /> : <Clock size={16} color="var(--accent-amber)" />}
                      <span>Stage 2: Quality & Release Authority</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: ecoApproved ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>
                      {ecoApproved ? 'APPROVED (Electronic Signature Recorded)' : 'PENDING VOTE'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: INDUSTRY CAPABILITIES */}
        {activeTab === 'capabilities' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Industry Capability Registry</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '4px' }}>
                One universal engine serving 40+ industries through declarative capability plugins.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginTop: '12px' }}>
              {[
                {
                  id: 'disc',
                  title: 'Discrete Manufacturing & Automotive',
                  enabled: true,
                  desc: 'Serial/lot effectivity, supplier part traceability, and EBOM-to-MBOM routings.',
                  features: ['EBOM to MBOM Transformation', 'Serial Number Effectivity', 'Plant-specific Routings'],
                },
                {
                  id: 'elec',
                  title: 'Electronics & PCB Hardware',
                  enabled: true,
                  desc: 'MPN tracking, reference designator ranges, component footprint, and AML/AVL sourcing.',
                  features: ['Reference Designators (R1, C12)', 'Approved Manufacturer List', 'Package / Footprint Metadata'],
                },
                {
                  id: 'proc',
                  title: 'Process & Chemical Formulation',
                  enabled: false,
                  desc: 'Recipe management, batch sizing, yield calculations, and UOM density conversions.',
                  features: ['Batch Scalability', 'Ingredient Yield Ratios', 'Allergen / Hazard Profiles'],
                },
                {
                  id: 'reg',
                  title: 'Regulated Medical & Aerospace',
                  enabled: false,
                  desc: 'Design History Files (DHF), Device Master Records (DMR), and 21 CFR Part 11 attestation.',
                  features: ['21 CFR Part 11 Electronic Signatures', 'DHF / DMR Traceability', 'Risk Matrix (FMEA)'],
                },
              ].map((pack) => (
                <div key={pack.id} className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>{pack.title}</h2>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontWeight: 600,
                          background: pack.enabled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.15)',
                          color: pack.enabled ? 'var(--accent-emerald)' : 'var(--text-muted)',
                        }}
                      >
                        {pack.enabled ? 'ACTIVATED' : 'AVAILABLE'}
                      </span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '8px' }}>
                      {pack.desc}
                    </p>
                    <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {pack.features.map((f, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                          <CheckCircle2 size={14} color="var(--accent-sky)" />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginTop: '20px', paddingTop: '12px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      style={{
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        color: pack.enabled ? 'var(--accent-rose)' : 'var(--accent-sky)',
                        background: 'transparent',
                      }}
                    >
                      {pack.enabled ? 'Configure Package' : 'Enable in Tenant'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: CATALYST ARCHITECTURE */}
        {activeTab === 'infra' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Zoho Catalyst Architecture</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '4px' }}>
                Operational topology mapping between Catalyst managed services and Universal PLM domains.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop: '12px' }}>
              <div className="glass-panel" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Server size={22} color="var(--accent-sky)" />
                  <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Catalyst AppSail</h3>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginTop: '8px' }}>
                  Hosts the Node.js Fastify backend API container. No serverless timeouts, allowing complex multi-level recursive BOM explosions and mass cost rollups.
                </p>
                <div style={{ marginTop: '16px', fontSize: '0.75rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>
                  ● Port: X_ZOHO_CATALYST_LISTEN_PORT (3000)
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Cloud size={22} color="var(--accent-indigo)" />
                  <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Catalyst Slate</h3>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginTop: '8px' }}>
                  Distributes the React single-page engineering application globally via edge CDN with instant cold starts and zero server management.
                </p>
                <div style={{ marginTop: '16px', fontSize: '0.75rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>
                  ● Edge Cached Static Bundle
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Cpu size={22} color="var(--accent-emerald)" />
                  <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Data Store (ZCQL) & Stratus</h3>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginTop: '8px' }}>
                  ZCQL manages tenant-partitioned relational tables for Parts and BOMs. Stratus stores CAD models, STEP files, and drawing PDFs securely.
                </p>
                <div style={{ marginTop: '16px', fontSize: '0.75rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>
                  ● Tenant Boundary Isolation Active
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal: Create New Part */}
      {showNewPartModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '500px',
              padding: '24px',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Create New Part Master</h2>
              <button
                onClick={() => setShowNewPartModal(false)}
                style={{ background: 'transparent', color: 'var(--text-muted)', fontSize: '1.25rem' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePart} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Part Number (Leave blank for auto-sequence)
                </label>
                <input
                  type="text"
                  placeholder="e.g. ROB-2020"
                  value={newPartNumber}
                  onChange={(e) => setNewPartNumber(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    padding: '10px 14px',
                    borderRadius: '6px',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Part Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dual-Channel Motor Driver"
                  value={newPartName}
                  onChange={(e) => setNewPartName(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    padding: '10px 14px',
                    borderRadius: '6px',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Type
                  </label>
                  <select
                    value={newPartType}
                    onChange={(e) => setNewPartType(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      padding: '10px 14px',
                      borderRadius: '6px',
                      color: 'var(--text-primary)',
                      fontSize: '0.875rem',
                    }}
                  >
                    <option value="ASSEMBLY">Assembly</option>
                    <option value="MANUFACTURED">Manufactured</option>
                    <option value="PURCHASED">Purchased</option>
                    <option value="SOFTWARE">Software</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Default UOM
                  </label>
                  <select
                    value={newPartUom}
                    onChange={(e) => setNewPartUom(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      padding: '10px 14px',
                      borderRadius: '6px',
                      color: 'var(--text-primary)',
                      fontSize: '0.875rem',
                    }}
                  >
                    <option value="EA">EA (Each)</option>
                    <option value="M">M (Meters)</option>
                    <option value="KG">KG (Kilograms)</option>
                    <option value="L">L (Liters)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowNewPartModal(false)}
                  style={{
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    padding: '10px 16px',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    background: 'linear-gradient(135deg, var(--accent-sky), var(--accent-blue))',
                    color: '#fff',
                    padding: '10px 18px',
                    borderRadius: '6px',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                  }}
                >
                  Create & Initialize Rev A
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
