"use client";
import { useMemo, useRef, useState } from "react";
import { upload } from "@vercel/blob/client";

const products = [
  { id:"demo", name:"Диван прямой — демонстрационный", price:"от 44 500 ₽", dimensions:"Подберём размер под комнату", image:"https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1000&q=85", note:"Пример изображения для теста" }
];
const fmt = (n) => Math.round(n) + "%";

export default function Home() {
  const roomInput = useRef(null);
  const sofaInput = useRef(null);
  const [roomFile,setRoomFile] = useState(null);
  const [roomPreview,setRoomPreview] = useState("");
  const [roomUrl,setRoomUrl] = useState("");
  const [sofaPreview,setSofaPreview] = useState(products[0].image);
  const [sofaUrl,setSofaUrl] = useState(products[0].image);
  const [customSofa,setCustomSofa] = useState(false);
  const [model,setModel] = useState("Base");
  const [prompt,setPrompt] = useState("Естественно размести выбранный диван в комнате. Сохрани планировку, стены, окна, освещение и ракурс исходной фотографии. Не добавляй другую мебель вместо выбранного дивана.");
  const [busy,setBusy] = useState(false);
  const [progress,setProgress] = useState(0);
  const [result,setResult] = useState("");
  const [error,setError] = useState("");
  const [uploaded,setUploaded] = useState(false);
  const [drag,setDrag] = useState(false);
  const [tab,setTab] = useState("room");

  async function uploadImage(file, kind) {
    if (!file) return;
    if (!["image/jpeg","image/png","image/webp"].includes(file.type)) { setError("Выберите JPG, PNG или WebP."); return; }
    if (file.size > 10*1024*1024) { setError("Максимальный размер фотографии — 10 МБ."); return; }
    setError("");
    const local = URL.createObjectURL(file);
    if (kind==="room") { setRoomFile(file); setRoomPreview(local); setRoomUrl(""); setResult(""); }
    else { setSofaPreview(local); setSofaUrl(""); setCustomSofa(true); setResult(""); }
    try {
      const blob = await upload(file.name, file, { access:"public", handleUploadUrl:"/api/upload", contentType:file.type });
      if (kind==="room") setRoomUrl(blob.url); else setSofaUrl(blob.url);
    } catch(e) { setError("Не удалось загрузить фото. Проверьте подключение и попробуйте ещё раз."); }
  }

  async function generate() {
    if (!roomUrl) { setError("Сначала загрузите фотографию комнаты и дождитесь завершения загрузки."); return; }
    if (!sofaUrl) { setError("Загрузите фотографию дивана или выберите модель каталога."); return; }
    setBusy(true); setError(""); setResult(""); setProgress(4);
    try {
      const start = await fetch("/api/try-on",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({roomImageUrl:roomUrl,furnitureImageUrl:sofaUrl,modelType:model,prompt})});
      const payload = await start.json();
      if (!start.ok) throw new Error(payload.error || "Не удалось запустить визуализацию");
      let finished = false;
      for (let i=0;i<45;i++) {
        await new Promise(r=>setTimeout(r,4000));
        const check = await fetch("/api/try-on?taskId="+encodeURIComponent(payload.taskId),{cache:"no-store"});
        const status = await check.json();
        if (!check.ok) throw new Error(status.error || "Не удалось получить результат");
        setProgress(Math.max(8,status.percentage || Math.min(92,8+i*2)));
        if (status.status==="Success" && status.resultUrl) { setResult(status.resultUrl); setProgress(100); finished = true; break; }
        if (status.status==="Failed") throw new Error("ИИ не смог обработать эту пару изображений. Попробуйте другое фото комнаты или дивана.");
      }
      if (!finished) throw new Error("Визуализация ещё обрабатывается. Попробуйте запустить проверку результата немного позже.");
    } catch(e) { setError(e.message || "Ошибка генерации. Попробуйте ещё раз."); }
    finally { setBusy(false); }
  }

  const canGenerate = Boolean(roomUrl && sofaUrl && !busy);
  const saveResult = async () => {
    if (!result) return;
    const a=document.createElement("a"); a.href=result; a.target="_blank"; a.rel="noreferrer"; a.download="willbe-visualization.jpg"; a.click();
  };

  return <main>
    <header className="topbar">
      <a className="brand" href="#"><span className="brand-mark">W</span><span>WILLBE<span className="brand-light"> / DESIGN</span></span></a>
      <div className="top-note"><span className="live-dot"></span> ВИРТУАЛЬНАЯ ПРИМЕРКА МЕБЕЛИ</div>
      <a className="top-link" href="https://willbe-design.ru/" target="_blank" rel="noreferrer">Официальный сайт ↗</a>
    </header>

    <section className="intro">
      <div className="eyebrow">ВАШ ИНТЕРЬЕР. ВАШ БУДУЩИЙ ДИВАН.</div>
      <h1>Посмотрите, как диван<br/><em>будет выглядеть у вас дома.</em></h1>
      <p>Загрузите фото комнаты, выберите модель — искусственный интеллект покажет мебель в вашем интерьере.</p>
      <div className="steps"><span><b>01</b> Фото комнаты</span><i></i><span><b>02</b> Выбор дивана</span><i></i><span><b>03</b> Визуализация</span></div>
    </section>

    <section className="workspace">
      <aside className="controls">
        <div className="panel-head"><div><span className="eyebrow">КОНСТРУКТОР</span><h2>Создайте свой интерьер</h2></div><span className="step-count">1 / 3</span></div>
        <div className="control-section">
          <div className="section-title"><span className="num">01</span><div><b>Загрузите фото комнаты</b><small>Снимок с телефона подойдёт</small></div></div>
          <div className={"upload-zone "+(drag?"drag":"")+(roomPreview?" has-image":"")} onDragOver={e=>{e.preventDefault();setDrag(true)}} onDragLeave={()=>setDrag(false)} onDrop={e=>{e.preventDefault();setDrag(false);uploadImage(e.dataTransfer.files?.[0],"room")}} onClick={()=>roomInput.current?.click()}>
            <input ref={roomInput} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={e=>uploadImage(e.target.files?.[0],"room")}/>
            {roomPreview ? <><img src={roomPreview} alt="Фото комнаты"/><span className="change-photo">Изменить фото</span></> : <><span className="upload-icon">↑</span><b>Загрузить фотографию</b><small>Нажмите или перетащите файл сюда</small><small className="muted">JPG, PNG или WEBP · до 10 МБ</small></>}
          </div>
          {roomPreview && <div className="upload-status"><span className={roomUrl?"status-ok":"status-wait"}>{roomUrl?"✓ Фото загружено":"Загружаем фото…"}</span><button onClick={()=>{setRoomPreview("");setRoomUrl("");setRoomFile(null);setResult("");}}>Удалить</button></div>}
        </div>

        <div className="control-section">
          <div className="section-title"><span className="num">02</span><div><b>Выберите диван</b><small>Каталог и собственные фотографии</small></div></div>
          <div className="product-card selected">
            <div className="product-image"><img src={sofaPreview || products[0].image} alt="Выбранный диван"/></div>
            <div className="product-info"><b>{customSofa?"Ваш диван":products[0].name}</b><span>{customSofa?"Загруженное фото":products[0].price}</span><small>{customSofa?"Фото для примерки":products[0].note}</small></div>
            <span className="check">✓</span>
          </div>
          <button className="outline-btn" onClick={()=>sofaInput.current?.click()}>＋ Загрузить фото другого дивана</button>
          <input ref={sofaInput} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={e=>uploadImage(e.target.files?.[0],"sofa")}/>
          <div className="hint">Для точной примерки лучше использовать фото дивана на однотонном или прозрачном фоне.</div>
        </div>

        <div className="control-section compact">
          <div className="section-title"><span className="num">03</span><div><b>Настройки результата</b><small>Качество ИИ-визуализации</small></div></div>
          <div className="quality-row"><button className={model==="Base"?"quality active":"quality"} onClick={()=>setModel("Base")}><b>Базовое</b><small>Быстрее</small></button><button className={model==="Pro"?"quality active":"quality"} onClick={()=>setModel("Pro")}><b>Профессиональное</b><small>Детальнее</small></button></div>
          <label className="prompt-label">Пожелания к размещению <span>необязательно</span></label>
          <textarea value={prompt} onChange={e=>setPrompt(e.target.value)} rows="3"/>
        </div>
        {error && <div className="error">{error}</div>}
        <button className="generate-btn" disabled={!canGenerate} onClick={generate}>{busy?<><span className="spinner"></span> Создаём визуализацию…</>:<>Создать визуализацию <span>→</span></>}</button>
        {busy && <div className="progress-wrap"><div className="progress-track"><div style={{width:fmt(progress)}}/></div><small>ИИ анализирует перспективу и освещение · {fmt(progress)}</small></div>}
        <p className="privacy">Фото комнаты и дивана загружаются в публичное хранилище по уникальным ссылкам и передаются провайдеру ИИ для обработки. Не загружайте личные или конфиденциальные изображения.</p>
      </aside>

      <div className="preview-area">
        <div className="preview-top"><div><span className="eyebrow">ПРЕДПРОСМОТР</span><h2>{result?"Ваш будущий интерьер":"Пространство для вашей идеи"}</h2></div><div className="preview-tabs"><button className={tab==="room"?"active":""} onClick={()=>setTab("room")}>Комната</button><button className={tab==="result"?"active":""} onClick={()=>setTab("result")} disabled={!result}>Результат</button></div></div>
        <div className="stage">
          {result ? <div className="result-view"><img src={result} alt="ИИ-визуализация интерьера"/><div className="result-label">ИИ-ВИЗУАЛИЗАЦИЯ</div></div> : roomPreview ? <div className="room-view"><img src={roomPreview} alt="Ваша комната"/><div className="room-overlay"><span>ФОТО ВАШЕЙ КОМНАТЫ</span><small>{roomUrl?"Готово к визуализации":"Загружаем изображение…"}</small></div></div> : <div className="empty-stage"><div className="room-illustration"><div className="window"></div><div className="plant">✳</div><div className="sofa-shape"><div className="sofa-back"></div><div className="sofa-seat"></div><div className="sofa-arm left"></div><div className="sofa-arm right"></div><div className="sofa-leg l1"></div><div className="sofa-leg l2"></div></div><div className="rug"></div><div className="side-table"></div></div><div className="empty-copy"><b>Здесь появится ваша комната</b><span>Загрузите фото слева, чтобы начать примерку</span></div></div>}
        </div>
        {result ? <div className="result-actions"><div><b>Готово — диван в вашем интерьере</b><small>Результат можно сохранить или отправить менеджеру</small></div><button onClick={saveResult}>Сохранить изображение ↓</button></div> : <div className="preview-foot"><span>✦</span><p><b>Визуализация с помощью ИИ</b><small>Учитывает перспективу, освещение и окружающую обстановку. Изображение носит ознакомительный характер.</small></p></div>}
      </div>
    </section>
    <section className="bottom-cta"><div><span className="eyebrow">WILLBE DESIGN</span><h2>Понравилось, как смотрится?</h2><p>Подберём ткань, размер и комплектацию. Рассчитаем стоимость и доставку.</p></div><a href="https://willbe-design.taplink.ws/" target="_blank" rel="noreferrer">Обсудить заказ ↗</a></section>
    <footer><span>WILLBE / DESIGN</span><span>Демонстрационный прототип · Краснодар</span><a href="https://willbe-design.ru/" target="_blank" rel="noreferrer">willbe-design.ru</a></footer>
  </main>;
}
