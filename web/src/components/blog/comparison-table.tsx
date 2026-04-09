'use client'

interface ComparisonRow {
  feature: string
  steward: string | boolean
  competitor: string | boolean
  highlight?: boolean
}

interface ComparisonGroup {
  category: string
  rows: ComparisonRow[]
}

interface ComparisonTableProps {
  competitorName: string
  groups: ComparisonGroup[]
}

function CellValue({ value }: { value: string | boolean }) {
  if (typeof value === 'boolean') {
    return (
      <span
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: value ? '#6EE7B7' : '#EF4444',
        }}
      >
        {value ? '\u2713' : '\u2717'}
      </span>
    )
  }
  return <span style={{ fontSize: 14 }}>{value}</span>
}

export default function ComparisonTable({
  competitorName,
  groups,
}: ComparisonTableProps) {
  return (
    <>
      {/* Desktop table */}
      <div
        className="comparison-table-desktop"
        style={{
          maxWidth: 760,
          margin: '40px auto',
          padding: '0 24px',
          overflowX: 'auto' as const,
        }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse' as const,
            fontSize: 14,
          }}
        >
          <thead>
            <tr
              style={{
                position: 'sticky' as const,
                top: 0,
                zIndex: 2,
                background: '#0E110E',
              }}
            >
              <th
                style={{
                  textAlign: 'left' as const,
                  padding: '12px 16px',
                  fontWeight: 600,
                  fontSize: 13,
                  color: 'rgba(247,246,243,0.5)',
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                  letterSpacing: '0.02em',
                }}
              >
                Feature
              </th>
              <th
                style={{
                  textAlign: 'center' as const,
                  padding: '12px 16px',
                  fontWeight: 600,
                  fontSize: 13,
                  color: '#6EE7B7',
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                  letterSpacing: '0.02em',
                  background: 'rgba(110,231,183,0.04)',
                }}
              >
                Steward
              </th>
              <th
                style={{
                  textAlign: 'center' as const,
                  padding: '12px 16px',
                  fontWeight: 600,
                  fontSize: 13,
                  color: 'rgba(247,246,243,0.5)',
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                  letterSpacing: '0.02em',
                }}
              >
                {competitorName}
              </th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => (
              <>
                <tr key={`group-${group.category}`}>
                  <td
                    colSpan={3}
                    style={{
                      padding: '14px 16px 8px',
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase' as const,
                      color: 'rgba(247,246,243,0.35)',
                      background: 'rgba(255,255,255,0.02)',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                    }}
                  >
                    {group.category}
                  </td>
                </tr>
                {group.rows.map((row, rowIdx) => (
                  <tr
                    key={`${group.category}-${row.feature}`}
                    style={{
                      background:
                        rowIdx % 2 === 0
                          ? 'transparent'
                          : 'rgba(255,255,255,0.015)',
                      borderLeft: row.highlight
                        ? '2px solid #F59E0B'
                        : '2px solid transparent',
                      ...(row.highlight
                        ? { background: 'rgba(245,158,11,0.04)' }
                        : {}),
                    }}
                  >
                    <td
                      style={{
                        padding: '12px 16px',
                        color: '#F7F6F3',
                        borderBottom:
                          '1px solid rgba(255,255,255,0.04)',
                      }}
                    >
                      {row.feature}
                    </td>
                    <td
                      style={{
                        padding: '12px 16px',
                        textAlign: 'center' as const,
                        borderBottom:
                          '1px solid rgba(255,255,255,0.04)',
                      }}
                    >
                      <CellValue value={row.steward} />
                    </td>
                    <td
                      style={{
                        padding: '12px 16px',
                        textAlign: 'center' as const,
                        borderBottom:
                          '1px solid rgba(255,255,255,0.04)',
                      }}
                    >
                      <CellValue value={row.competitor} />
                    </td>
                  </tr>
                ))}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card layout */}
      <div
        className="comparison-table-mobile"
        style={{
          maxWidth: 760,
          margin: '40px auto',
          padding: '0 24px',
          display: 'none',
        }}
      >
        {groups.map((group) => (
          <div key={`mobile-${group.category}`}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase' as const,
                color: 'rgba(247,246,243,0.35)',
                padding: '16px 0 8px',
              }}
            >
              {group.category}
            </div>
            {group.rows.map((row) => (
              <div
                key={`mobile-${group.category}-${row.feature}`}
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 10,
                  padding: '14px 16px',
                  marginBottom: 10,
                  borderLeft: row.highlight
                    ? '2px solid #F59E0B'
                    : '2px solid transparent',
                  ...(row.highlight
                    ? { background: 'rgba(245,158,11,0.04)' }
                    : {}),
                }}
              >
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: 14,
                    marginBottom: 10,
                    color: '#F7F6F3',
                  }}
                >
                  {row.feature}
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: 24,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 11,
                        color: '#6EE7B7',
                        fontWeight: 600,
                        marginBottom: 4,
                      }}
                    >
                      Steward
                    </div>
                    <CellValue value={row.steward} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 11,
                        color: 'rgba(247,246,243,0.5)',
                        fontWeight: 600,
                        marginBottom: 4,
                      }}
                    >
                      {competitorName}
                    </div>
                    <CellValue value={row.competitor} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 639px) {
          .comparison-table-desktop { display: none !important; }
          .comparison-table-mobile { display: block !important; }
        }
        @media (min-width: 640px) {
          .comparison-table-desktop { display: block !important; }
          .comparison-table-mobile { display: none !important; }
        }
      `}</style>
    </>
  )
}
