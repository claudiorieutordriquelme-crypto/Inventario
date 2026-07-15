// Parser de archivos de bordado .DST (formato Tajima) en el navegador.
// El .DST guarda las puntadas como registros de 3 bytes; la unidad es 0,1 mm.
// Calcula el largo de hilo por bloque de color (segmentos separados por cambios
// de color / STOP) para estimar el consumo y su costo. Los saltos (jump) no
// suman hilo porque se recortan.

export interface DstSegment {
  color: number // indice de color (1 = primer color)
  puntadas: number
  metros: number
}

export interface DstResult {
  puntadas: number
  cambiosColor: number
  metros: number
  segmentos: DstSegment[]
}

// Decodifica el desplazamiento (dx, dy) de un registro de 3 bytes DST, segun el
// mapeo estandar (pesos base-3: 1,3,9,27,81). Para el largo de hilo solo importa
// la MAGNITUD de cada desplazamiento, por lo que el signo/negacion final de Y
// no afecta el calculo de distancia.
function decodeStitch(b0: number, b1: number, b2: number): [number, number] {
  let x = 0
  let y = 0
  // Eje X
  if (b2 & 0x04) x += 81
  if (b2 & 0x08) x -= 81
  if (b1 & 0x04) x += 27
  if (b1 & 0x08) x -= 27
  if (b0 & 0x04) x += 9
  if (b0 & 0x08) x -= 9
  if (b1 & 0x01) x += 3
  if (b1 & 0x02) x -= 3
  if (b0 & 0x01) x += 1
  if (b0 & 0x02) x -= 1
  // Eje Y
  if (b2 & 0x20) y += 81
  if (b2 & 0x10) y -= 81
  if (b1 & 0x20) y += 27
  if (b1 & 0x10) y -= 27
  if (b0 & 0x20) y += 9
  if (b0 & 0x10) y -= 9
  if (b1 & 0x80) y += 3
  if (b1 & 0x40) y -= 3
  if (b0 & 0x80) y += 1
  if (b0 & 0x40) y -= 1
  return [x, y]
}

export function parseDst(buffer: ArrayBuffer): DstResult {
  const d = new Uint8Array(buffer)
  // El header DST ocupa 512 bytes; las puntadas empiezan despues.
  let i = d.length > 512 ? 512 : 0
  let color = 1
  const segmentos: DstSegment[] = [{ color, puntadas: 0, metros: 0 }]
  let puntadas = 0
  let cambiosColor = 0

  for (; i + 2 < d.length; i += 3) {
    const b0 = d[i]
    const b1 = d[i + 1]
    const b2 = d[i + 2]
    if ((b2 & 0xf3) === 0xf3) break // fin del diseno

    const esStop = (b2 & 0xc3) === 0xc3 // cambio de color / stop
    const esJump = !esStop && (b2 & 0x83) === 0x83 // salto (no cose)

    if (esStop) {
      cambiosColor += 1
      color += 1
      segmentos.push({ color, puntadas: 0, metros: 0 })
      continue
    }

    if (!esJump) {
      const [dx, dy] = decodeStitch(b0, b1, b2)
      const distMm = Math.sqrt(dx * dx + dy * dy) * 0.1 // unidad DST = 0,1 mm
      const seg = segmentos[segmentos.length - 1]
      seg.metros += distMm / 1000
      seg.puntadas += 1
      puntadas += 1
    }
  }

  const limpios = segmentos.filter((s) => s.puntadas > 0)
  const metros = limpios.reduce((s, x) => s + x.metros, 0)
  return { puntadas, cambiosColor, metros, segmentos: limpios }
}

// Costo del hilo de bordado: metros x precio por metro x factor de correccion.
// El factor cubre tension/tira-hilo y el hilo de bobina (subestimados por el
// largo geometrico). Calibrable con un carrete real.
export function costoBordado(metros: number, precioMetro: number, factor: number): number {
  return Math.round(metros * precioMetro * factor)
}
