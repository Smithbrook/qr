(function(){
  const $ = id => document.getElementById(id);

  // ============================================================
  // Content type field definitions and data-string builders
  // ============================================================
  const TYPES = {
    url: {
      fields: [{ id:'url_value', label:'Link', placeholder:'https://example.com', type:'text' }],
      build: v => v.url_value || 'https://'
    },
    text: {
      fields: [{ id:'text_value', label:'Text', placeholder:'Anything you want encoded…', type:'textarea' }],
      build: v => v.text_value || ' '
    },
    wifi: {
      fields: [
        { id:'wifi_ssid', label:'Network name (SSID)', placeholder:'MyWiFi', type:'text' },
        { id:'wifi_password', label:'Password', placeholder:'••••••••', type:'text' },
        { id:'wifi_type', label:'Security', type:'select', options:['WPA','WEP','nopass'] }
      ],
      build: v => `WIFI:T:${v.wifi_type||'WPA'};S:${v.wifi_ssid||''};P:${v.wifi_password||''};H:false;;`
    },
    contact: {
      fields: [
        { id:'contact_name', label:'Full name', placeholder:'Ray Smith', type:'text' },
        { id:'contact_phone', label:'Phone', placeholder:'+1 555 123 4567', type:'text' },
        { id:'contact_email', label:'Email', placeholder:'ray@example.com', type:'text' },
        { id:'contact_org', label:'Company', placeholder:'Smith Ideas', type:'text' }
      ],
      build: v => `BEGIN:VCARD\nVERSION:3.0\nFN:${v.contact_name||''}\nORG:${v.contact_org||''}\nTEL:${v.contact_phone||''}\nEMAIL:${v.contact_email||''}\nEND:VCARD`
    },
    email: {
      fields: [
        { id:'email_to', label:'To', placeholder:'someone@example.com', type:'text' },
        { id:'email_subject', label:'Subject', placeholder:'', type:'text' },
        { id:'email_body', label:'Message', placeholder:'', type:'textarea' }
      ],
      build: v => `mailto:${v.email_to||''}?subject=${encodeURIComponent(v.email_subject||'')}&body=${encodeURIComponent(v.email_body||'')}`
    },
    sms: {
      fields: [
        { id:'sms_number', label:'Phone number', placeholder:'+1 555 123 4567', type:'text' },
        { id:'sms_message', label:'Message', placeholder:'', type:'textarea' }
      ],
      build: v => `SMSTO:${v.sms_number||''}:${v.sms_message||''}`
    },
    phone: {
      fields: [{ id:'phone_number', label:'Phone number', placeholder:'+1 555 123 4567', type:'text' }],
      build: v => `tel:${v.phone_number||''}`
    }
  };

  let activeType = 'url';
  let fieldValues = {};
  let logoDataUrl = null;

  function renderFields(){
    const def = TYPES[activeType];
    $('typeFields').innerHTML = def.fields.map(f => {
      if (f.type === 'textarea') {
        return `<div class="field"><label for="${f.id}">${f.label}</label><textarea id="${f.id}" placeholder="${f.placeholder||''}"></textarea></div>`;
      }
      if (f.type === 'select') {
        return `<div class="field"><label for="${f.id}">${f.label}</label><select id="${f.id}">${f.options.map(o=>`<option value="${o}">${o}</option>`).join('')}</select></div>`;
      }
      return `<div class="field"><label for="${f.id}">${f.label}</label><input type="text" id="${f.id}" placeholder="${f.placeholder||''}"></div>`;
    }).join('');
    def.fields.forEach(f => {
      const el = $(f.id);
      if (fieldValues[f.id]) el.value = fieldValues[f.id];
      el.addEventListener('input', () => { fieldValues[f.id] = el.value; updateQR(); });
      if (f.type === 'select') el.addEventListener('change', () => { fieldValues[f.id] = el.value; updateQR(); });
    });
    updateQR();
  }

  $('typeTabs').addEventListener('click', (e) => {
    const tab = e.target.closest('.type-tab');
    if (!tab) return;
    activeType = tab.getAttribute('data-type');
    document.querySelectorAll('.type-tab').forEach(t => t.classList.toggle('active', t === tab));
    renderFields();
  });

  // ============================================================
  // Colors, dot style, logo
  // ============================================================
  let dotStyle = 'square';
  $('dotStyleGrid').addEventListener('click', (e) => {
    const opt = e.target.closest('.style-opt');
    if (!opt) return;
    dotStyle = opt.getAttribute('data-dots');
    document.querySelectorAll('.style-opt').forEach(o => o.classList.toggle('active', o === opt));
    updateQR();
  });

  $('fgColor').addEventListener('input', (e) => { $('fgVal').textContent = e.target.value; updateQR(); });
  $('bgColor').addEventListener('input', (e) => { $('bgVal').textContent = e.target.value; updateQR(); });
  $('ecLevel').addEventListener('change', updateQR);

  $('logoInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      logoDataUrl = reader.result;
      $('logoName').textContent = file.name;
      $('logoClear').style.display = 'inline';
      $('ecLevel').value = 'H';
      updateQR();
    };
    reader.readAsDataURL(file);
  });
  $('logoClear').addEventListener('click', () => {
    logoDataUrl = null;
    $('logoInput').value = '';
    $('logoName').textContent = 'None';
    $('logoClear').style.display = 'none';
    updateQR();
  });

  // ============================================================
  // QR rendering
  // ============================================================
  let qrCode = null;
  function updateQR(){
    try {
      const data = TYPES[activeType].build(fieldValues);
      const options = {
        width: 400, height: 400,
        data: data || ' ',
        margin: 8,
        qrOptions: { errorCorrectionLevel: $('ecLevel').value },
        dotsOptions: { color: $('fgColor').value, type: dotStyle },
        backgroundOptions: { color: $('bgColor').value },
        cornersSquareOptions: { color: $('fgColor').value, type: dotStyle === 'square' ? 'square' : 'extra-rounded' },
        cornersDotOptions: { color: $('fgColor').value, type: dotStyle === 'square' ? 'square' : 'dot' },
        image: logoDataUrl || undefined,
        imageOptions: { crossOrigin: 'anonymous', margin: 6, imageSize: 0.4 }
      };
      if (!qrCode) {
        qrCode = new QRCodeStyling(options);
        qrCode.append($('qrCanvas'));
      } else {
        qrCode.update(options);
      }
    } catch (err) {
      console.error('QR update failed:', err);
    }
  }

  $('downloadPng').addEventListener('click', () => {
    if (!qrCode) return;
    qrCode.download({ name: 'qr-code', extension: 'png' }).catch(err => console.error('PNG download failed:', err));
  });
  $('downloadSvg').addEventListener('click', () => {
    if (!qrCode) return;
    qrCode.download({ name: 'qr-code', extension: 'svg' }).catch(err => console.error('SVG download failed:', err));
  });

  // ---- Init ----
  window.addEventListener('load', () => {
    setTimeout(() => {
      if (typeof QRCodeStyling === 'undefined') {
        $('qrCanvas').innerHTML = '<p style="font-size:12px;color:#9C9C96;padding:20px;">The QR library didn\'t load — try opening this file in a real browser tab instead of a preview panel.</p>';
      }
    }, 1200);
  });

  fieldValues.url_value = 'https://nofluffqr.com';
  renderFields();
})();