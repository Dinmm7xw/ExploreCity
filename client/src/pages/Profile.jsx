import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { API_URL } from '../config';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

function Profile() {
  const { t } = useTranslation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  const [savedEvents, setSavedEvents] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [myTickets, setMyTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const [savedRes, myRes, ticketsRes] = await Promise.all([
        fetch(`${API_URL}/api/events/saved`, { headers }),
        fetch(`${API_URL}/api/events/my`, { headers }),
        fetch(`${API_URL}/api/events/tickets`, { headers })
      ]);

      if (savedRes.ok) setSavedEvents(await savedRes.json());
      if (myRes.ok) setMyEvents(await myRes.json());
      if (ticketsRes.ok) setMyTickets(await ticketsRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const EventList = ({ events, emptyMsg }) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginTop: '16px' }}>
      {events.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}><i className="fas fa-info-circle"></i> {emptyMsg}</p>
      ) : (
        events.map(ev => {
          const getYouTubeId = (url) => {
            if (!url) return null;
            const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
            const match = url.match(regExp);
            return (match && match[2].length === 11) ? match[2] : null;
          };

          const ytId = getYouTubeId(ev.image_url);
          const thumbImg = ytId 
            ? `https://img.youtube.com/vi/${ytId}/default.jpg` 
            : (ev.image_url || `https://picsum.photos/200/200?random=${ev.id}`);

          return (
            <div key={ev.id} className="glass-card" style={{ padding: '16px', display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '12px', background: `url(${thumbImg}) center/cover`, flexShrink: 0 }}></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4 style={{ fontSize: '16px', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.title}</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>{ev.date}</p>
                <Link to={`/event/${ev.id}`} className="btn-primary" style={{ padding: '6px 12px', fontSize: '12px', display: 'inline-block', textDecoration: 'none' }}>{t('view_btn')}</Link>
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  const handlePrint = (ticketId) => {
    const ticketElement = document.getElementById(`ticket-${ticketId}`);
    if (!ticketElement) return;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>${t('home')} ExploreCity #${ticketId}</title>
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
          <style>
            body { font-family: 'Inter', sans-serif; display: flex; justify-content: center; padding: 50px; background: #f0f2f5; }
            .ticket-print { 
              background: white; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); 
              display: flex; width: 600px; padding: 0; overflow: hidden; border: 1px solid #eee;
            }
            .info { padding: 40px; flex: 1; border-right: 2px dashed #ccc; }
            .qr { padding: 30px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #fafafa; }
            h2 { color: #c17b4c; margin: 0 0 10px; font-size: 24px; }
            p { margin: 5px 0; color: #555; }
            .badge { background: #c17b4c; color: white; padding: 4px 10px; border-radius: 5px; font-size: 12px; font-weight: bold; }
            .seats-info { margin-top: 15px; padding: 10px; background: #fff5f0; border-radius: 8px; border: 1px solid #ffeada; font-weight: bold; color: #c17b4c; }
          </style>
        </head>
        <body>
          <div class="ticket-print">
            <div class="info">
              <span class="badge">${t('electronic_ticket')}</span>
              <h1 style="font-size: 22px; margin: 15px 0;">${ticketElement.querySelector('h4').innerText}</h1>
              ${ticketElement.querySelector('.main-info').innerHTML}
              ${ticketElement.querySelector('.seats-tag') ? `<div class="seats-info">${t('seats_label')}: ${ticketElement.querySelector('.seats-tag').innerText}</div>` : ''}
            </div>
            <div class="qr">
              ${ticketElement.querySelector('.qr-code-box').innerHTML}
              <p style="font-size: 12px; margin-top: 15px; font-weight: bold;">ID: ${ticketId}</p>
            </div>
          </div>
          <script>
            setTimeout(() => { window.print(); window.close(); }, 500);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownloadPDF = async (ticketId, title) => {
    const ticketElement = document.getElementById(`ticket-${ticketId}`);
    if (!ticketElement) return;

    // Скрываем кнопки на время захвата
    const actions = ticketElement.querySelector('.ticket-actions');
    if (actions) actions.style.visibility = 'hidden';

    try {
      const canvas = await html2canvas(ticketElement, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width / 2, canvas.height / 2]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`Ticket-${title}-${ticketId}.pdf`);
    } catch (err) {
      console.error('PDF generation error:', err);
    } finally {
      if (actions) actions.style.visibility = 'visible';
    }
  };

  const TicketList = ({ tickets }) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '24px', marginTop: '16px' }}>
      {tickets.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}><i className="fas fa-ticket-alt"></i> {t('no_tickets')}</p>
      ) : (
        tickets.map(tk => (
          <div key={tk.ticket_id} id={`ticket-${tk.ticket_id}`} style={{ 
            display: 'flex', background: 'white', borderRadius: '16px', overflow: 'hidden', 
            boxShadow: '0 10px 30px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.05)'
          }}>
            <div style={{ padding: '24px', flex: 1, minWidth: 0, borderRight: '2px dashed #e1e4e8', overflow: 'hidden' }}>
              <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 'bold', textTransform: 'uppercase' }}>{t('event_ticket')}</span>
              <h4 style={{ fontSize: '18px', margin: '4px 0 12px', color: 'var(--text-main)', lineHeight: '1.3', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tk.title}</h4>
              <div className="main-info">
                <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}><i className="far fa-calendar-alt"></i> {tk.session_date || tk.date} {t('at_time')} {tk.session_time || tk.time}</p>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}><i className="fas fa-map-marker-alt"></i> {tk.session_location || tk.location}, {tk.session_city || tk.city}</p>
              </div>

              {tk.seats && (
                <div className="seats-tag" style={{ marginTop: '12px', fontSize: '13px', color: 'var(--primary)', fontWeight: 'bold', background: 'rgba(193, 123, 76, 0.1)', padding: '4px 10px', borderRadius: '6px', display: 'inline-block' }}>
                  <i className="fas fa-couch"></i> {t('seats_label')}: {tk.seats}
                </div>
              )}
              
              <div className="ticket-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
                <div style={{ background: '#f9fafc', padding: '6px 12px', border: '1px solid #eee', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold' }}>
                  {tk.ticket_count} {t('ticket_count')}
                </div>
                <button 
                  onClick={() => handlePrint(tk.ticket_id)}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <i className="fas fa-print"></i> {t('print_btn')}
                </button>
                <button 
                  onClick={() => handleDownloadPDF(tk.ticket_id, tk.title)}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <i className="fas fa-file-pdf"></i> PDF
                </button>
                <Link 
                  to={`/refund/${tk.ticket_id}`}
                  style={{ textDecoration: 'none', color: '#e74c3c', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px', marginLeft: 'auto' }}>
                  <i className="fas fa-undo"></i> {t('refund_ticket_btn')}
                </Link>
              </div>
            </div>
            
            <div style={{ width: '130px', minWidth: '130px', maxWidth: '130px', flexShrink: 0, padding: '15px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fafafa', boxSizing: 'border-box' }}>
              <div className="qr-code-box" style={{ width: '82px', height: '82px', padding: '5px', background: 'white', border: '1px solid #eee', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', boxSizing: 'border-box' }}>
                <QRCodeSVG 
                  value={`${window.location.origin}/check-ticket?id=${tk.ticket_id}&user=${user.id}`} 
                  size={70} 
                  level={"H"} 
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
              <span style={{ fontSize: '11px', marginTop: '10px', color: 'var(--text-muted)', fontWeight: 'bold' }}>TKT-{tk.ticket_id}</span>
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="container" style={{ padding: '60px 20px', minHeight: '70vh' }}>
      <div className="glass-card" style={{ padding: '50px', maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* Profile Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '30px', marginBottom: '40px', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '30px' }}>
          <div style={{ width: '100px', height: '100px', background: 'var(--primary)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', fontWeight: 'bold' }}>
            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h1 style={{ fontSize: '32px', marginBottom: '8px', color: 'var(--text-main)' }}>{user.name}</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '18px' }}>{user.email}</p>
            <span style={{ display: 'inline-block', marginTop: '8px', padding: '4px 12px', background: 'rgba(0,0,0,0.05)', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
              {t('role_label')}: {user.role === 'admin' ? t('role_admin') : t('role_user')}
            </span>
          </div>
        </div>
        
        {loading ? (
          <div style={{ textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto', borderColor: 'var(--primary)', borderTopColor: 'transparent' }}></div><p style={{marginTop: '10px'}}>{t('loading')}</p></div>
        ) : (
          <>
            {/* Блок: QR Билеты */}
            <div style={{ marginBottom: '50px' }}>
              <h3 style={{ fontSize: '24px', borderBottom: '3px solid var(--primary)', display: 'inline-block', paddingBottom: '8px', marginBottom: '10px' }}>
                <i className="fas fa-qrcode"></i> {t('my_tickets')}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>{t('qr_hint')}</p>
              <TicketList tickets={myTickets} />
            </div>

            {/* Блок: Избранное */}
            <div style={{ marginBottom: '50px' }}>
              <h3 style={{ fontSize: '22px', borderBottom: '2px solid rgba(0,0,0,0.1)', display: 'inline-block', paddingBottom: '8px' }}>
                <i className="fas fa-bookmark"></i> {t('saved_events')} 
              </h3>
              <EventList events={savedEvents} emptyMsg={t('no_saved')} />
            </div>

            {/* Block: My Events */}
            <div>
              <h3 style={{ fontSize: '22px', borderBottom: '2px solid rgba(0,0,0,0.1)', display: 'inline-block', paddingBottom: '8px' }}>
                <i className="fas fa-calendar-plus"></i> {t('my_organized_events')}
              </h3>
              <EventList events={myEvents} emptyMsg={t('no_organized')} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Profile;
