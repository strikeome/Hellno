        class ProceduralTextureEngine {
            // Generates a true RGB Normal Map from any grayscale height/albedo canvas
            static generateNormalMapFromCanvas(sourceCanvas, strength = 2.8) {
                const w = sourceCanvas.width;
                const h = sourceCanvas.height;
                const srcCtx = sourceCanvas.getContext('2d');
                const srcData = srcCtx.getImageData(0, 0, w, h).data;

                const normCanvas = document.createElement('canvas');
                normCanvas.width = w;
                normCanvas.height = h;
                const normCtx = normCanvas.getContext('2d');
                const dstImg = normCtx.createImageData(w, h);
                const dstData = dstImg.data;

                const getHeight = (x, y) => {
                    const cx = (x + w) % w;
                    const cy = (y + h) % h;
                    const idx = (cy * w + cx) * 4;
                    return (srcData[idx] * 0.299 + srcData[idx + 1] * 0.587 + srcData[idx + 2] * 0.114) / 255.0;
                };

                for (let y = 0; y < h; y++) {
                    for (let x = 0; x < w; x++) {
                        const dX = (getHeight(x + 1, y) - getHeight(x - 1, y)) * strength;
                        const dY = (getHeight(x, y + 1) - getHeight(x, y - 1)) * strength;
                        let nx = -dX;
                        let ny = -dY;
                        let nz = 1.0;
                        const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
                        nx /= len; ny /= len; nz /= len;

                        const idx = (y * w + x) * 4;
                        dstData[idx] = Math.floor((nx * 0.5 + 0.5) * 255);
                        dstData[idx + 1] = Math.floor((ny * 0.5 + 0.5) * 255);
                        dstData[idx + 2] = Math.floor((nz * 0.5 + 0.5) * 255);
                        dstData[idx + 3] = 255;
                    }
                }
                normCtx.putImageData(dstImg, 0, 0);
                const normalTex = new THREE.CanvasTexture(normCanvas);
                normalTex.wrapS = THREE.RepeatWrapping;
                normalTex.wrapT = THREE.RepeatWrapping;
                return normalTex;
            }

            static createSandstoneWallTexture() {
                const canvas = document.createElement('canvas');
                canvas.width = 1024;
                canvas.height = 1024;
                const ctx = canvas.getContext('2d');

                // Base Mediterranean sandstone & aged stucco plaster (Standoff 2 Sandstone / Valorant Bind)
                const baseGrad = ctx.createLinearGradient(0, 0, 0, 1024);
                baseGrad.addColorStop(0, '#e3d5c5');
                baseGrad.addColorStop(0.7, '#d5c2ad');
                baseGrad.addColorStop(1, '#9c8874');
                ctx.fillStyle = baseGrad;
                ctx.fillRect(0, 0, 1024, 1024);

                // Cut limestone ashlar blocks with bevels and mortar grooves
                const rows = 10;
                const rowH = 1024 / rows;
                for (let r = 0; r < rows; r++) {
                    const y = r * rowH;
                    const cols = 4;
                    const colW = 1024 / cols;
                    const offset = (r % 2) * (colW / 2);

                    for (let c = -1; c <= cols; c++) {
                        const x = c * colW + offset;
                        const shadeDelta = (Math.random() - 0.5) * 18;
                        ctx.fillStyle = `rgb(${214 + shadeDelta}, ${195 + shadeDelta}, ${173 + shadeDelta})`;
                        ctx.fillRect(x + 4, y + 4, colW - 8, rowH - 8);

                        // Highlight top-left edge, shadow bottom-right edge for deep relief
                        ctx.strokeStyle = 'rgba(255, 250, 240, 0.35)';
                        ctx.lineWidth = 2;
                        ctx.strokeRect(x + 5, y + 5, colW - 10, rowH - 10);

                        ctx.strokeStyle = 'rgba(55, 42, 30, 0.65)';
                        ctx.lineWidth = 4;
                        ctx.strokeRect(x + 2, y + 2, colW - 4, rowH - 4);
                    }
                }

                // Exposed damaged red-clay brickwork patches (Standoff 2 signature realism)
                const patches = [
                    { cx: 240, cy: 310, rx: 110, ry: 75 },
                    { cx: 760, cy: 620, rx: 135, ry: 85 },
                    { cx: 480, cy: 820, rx: 95, ry: 60 }
                ];
                patches.forEach(p => {
                    ctx.save();
                    ctx.beginPath();
                    for (let a = 0; a < Math.PI * 2; a += 0.25) {
                        const radX = p.rx * (0.75 + Math.random() * 0.4);
                        const radY = p.ry * (0.75 + Math.random() * 0.4);
                        const px = p.cx + Math.cos(a) * radX;
                        const py = p.cy + Math.sin(a) * radY;
                        if (a === 0) ctx.moveTo(px, py);
                        else ctx.lineTo(px, py);
                    }
                    ctx.closePath();
                    ctx.fillStyle = '#4a3528';
                    ctx.fill();
                    ctx.lineWidth = 6;
                    ctx.strokeStyle = '#8c7662';
                    ctx.stroke();
                    ctx.clip();

                    // Draw exposed bricks inside the chipped plaster patch
                    const bH = 24, bW = 56;
                    for (let by = p.cy - p.ry - 40; by < p.cy + p.ry + 40; by += bH) {
                        const bOff = (Math.floor(by / bH) % 2) * (bW / 2);
                        for (let bx = p.cx - p.rx - 40; bx < p.cx + p.rx + 40; bx += bW) {
                            ctx.fillStyle = (bx + by) % 3 === 0 ? '#9e4736' : '#873b2c';
                            ctx.fillRect(bx + bOff + 2, by + 2, bW - 4, bH - 4);
                        }
                    }
                    ctx.restore();
                });

                // Fine micro-grain & ambient occlusion dirt at bottom base
                for (let i = 0; i < 16000; i++) {
                    const x = Math.random() * 1024;
                    const y = Math.random() * 1024;
                    const a = Math.random() * 0.08;
                    ctx.fillStyle = Math.random() > 0.5 ? `rgba(255,255,255,${a})` : `rgba(45,32,22,${a})`;
                    ctx.fillRect(x, y, 3, 3);
                }

                // Bottom tactical concrete wainscot & trim
                const trimGrad = ctx.createLinearGradient(0, 890, 0, 1024);
                trimGrad.addColorStop(0, '#2b333c');
                trimGrad.addColorStop(1, '#161b20');
                ctx.fillStyle = trimGrad;
                ctx.fillRect(0, 900, 1024, 124);
                ctx.fillStyle = '#c89d54';
                ctx.fillRect(0, 892, 1024, 8);

                const tex = new THREE.CanvasTexture(canvas);
                tex.wrapS = THREE.RepeatWrapping;
                tex.wrapT = THREE.RepeatWrapping;
                tex.normalMap = this.generateNormalMapFromCanvas(canvas, 3.2);
                return tex;
            }

            static createPlasterFacadeTexture(baseColor = '#e8dccb', accentColor = '#3d5a80') {
                const canvas = document.createElement('canvas');
                canvas.width = 512;
                canvas.height = 512;
                const ctx = canvas.getContext('2d');

                ctx.fillStyle = baseColor;
                ctx.fillRect(0, 0, 512, 512);

                // Subtle vertical rain streaks & stucco roughness
                for (let i = 0; i < 6000; i++) {
                    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(60,45,35,0.05)';
                    ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 5);
                }

                // Ornamental Mediterranean frieze band
                ctx.fillStyle = accentColor;
                ctx.fillRect(0, 42, 512, 18);
                ctx.fillStyle = '#d4a373';
                ctx.fillRect(0, 60, 512, 6);

                const tex = new THREE.CanvasTexture(canvas);
                tex.wrapS = THREE.RepeatWrapping;
                tex.wrapT = THREE.RepeatWrapping;
                tex.normalMap = this.generateNormalMapFromCanvas(canvas, 2.0);
                return tex;
            }

            static createTacticalFloorTexture() {
                const canvas = document.createElement('canvas');
                canvas.width = 1024;
                canvas.height = 1024;
                const ctx = canvas.getContext('2d');

                // Mortar bed
                ctx.fillStyle = '#3d3832';
                ctx.fillRect(0, 0, 1024, 1024);

                // Realistic interlocking cobblestone & cut sandstone pavers
                const rows = 16;
                const rowH = 1024 / rows;
                for (let r = 0; r < rows; r++) {
                    const y = r * rowH;
                    const cols = r % 2 === 0 ? 12 : 16;
                    const colW = 1024 / cols;
                    const off = (r % 3) * 18;

                    for (let c = -1; c <= cols; c++) {
                        const x = c * colW + off;
                        const base = 118 + Math.floor(Math.random() * 28);
                        const warm = Math.floor(Math.random() * 14);
                        ctx.fillStyle = `rgb(${base + warm}, ${base + Math.floor(warm * 0.5)}, ${base - 6})`;

                        // Rounded stone paver
                        const pad = 3;
                        ctx.beginPath();
                        ctx.roundRect ? ctx.roundRect(x + pad, y + pad, colW - pad * 2, rowH - pad * 2, 6)
                                      : ctx.rect(x + pad, y + pad, colW - pad * 2, rowH - pad * 2);
                        ctx.fill();

                        // Edge highlight
                        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
                        ctx.lineWidth = 1.5;
                        ctx.stroke();
                    }
                }

                // Sand drift & tactical tire/foot traffic grime
                for (let i = 0; i < 14000; i++) {
                    ctx.fillStyle = Math.random() > 0.45 ? 'rgba(215, 195, 165, 0.07)' : 'rgba(25, 22, 18, 0.08)';
                    ctx.fillRect(Math.random() * 1024, Math.random() * 1024, 3, 3);
                }

                const tex = new THREE.CanvasTexture(canvas);
                tex.wrapS = THREE.RepeatWrapping;
                tex.wrapT = THREE.RepeatWrapping;
                tex.repeat.set(16, 16);
                tex.normalMap = this.generateNormalMapFromCanvas(canvas, 3.5);
                tex.normalMap.repeat.set(16, 16);
                return tex;
            }

            static createRadianiteCrateTexture() {
                const canvas = document.createElement('canvas');
                canvas.width = 512;
                canvas.height = 512;
                const ctx = canvas.getContext('2d');

                // Heavy titanium outer armor frame
                ctx.fillStyle = '#111921';
                ctx.fillRect(0, 0, 512, 512);

                // Glowing Turquoise Radianite containment core (Valorant authentic style)
                const grad = ctx.createRadialGradient(256, 256, 20, 256, 256, 220);
                grad.addColorStop(0, '#72efdd');
                grad.addColorStop(0.45, '#00b4d8');
                grad.addColorStop(0.85, '#0077b6');
                grad.addColorStop(1, '#081c24');
                ctx.fillStyle = grad;
                ctx.fillRect(42, 42, 428, 428);

                // Hexagonal energy grid inside core
                ctx.strokeStyle = 'rgba(180, 255, 245, 0.25)';
                ctx.lineWidth = 2;
                for (let y = 50; y < 460; y += 32) {
                    for (let x = 50; x < 460; x += 32) {
                        ctx.strokeRect(x, y, 28, 28);
                    }
                }

                // Heavy diagonal metallic X-brace & corner bumpers
                ctx.strokeStyle = '#1d2833';
                ctx.lineWidth = 34;
                ctx.strokeRect(22, 22, 468, 468);
                ctx.beginPath();
                ctx.moveTo(26, 26); ctx.lineTo(486, 486);
                ctx.moveTo(486, 26); ctx.lineTo(26, 486);
                ctx.stroke();

                // High-visibility Kingdom Corp Amber & Cyan stencils
                ctx.strokeStyle = '#00f5d4';
                ctx.lineWidth = 4;
                ctx.strokeRect(46, 46, 420, 420);

                ctx.fillStyle = '#ffb703';
                [[28, 28], [452, 28], [28, 452], [452, 452]].forEach(([cx, cy]) => {
                    ctx.fillRect(cx, cy, 32, 32);
                });

                ctx.fillStyle = '#0b1219';
                ctx.fillRect(116, 228, 280, 56);
                ctx.strokeStyle = '#00f5d4';
                ctx.lineWidth = 2;
                ctx.strokeRect(116, 228, 280, 56);

                ctx.fillStyle = '#ece8e1';
                ctx.font = 'bold 30px Rajdhani, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('KINGDOM // RAD-X', 256, 266);

                const tex = new THREE.CanvasTexture(canvas);
                tex.normalMap = this.generateNormalMapFromCanvas(canvas, 2.5);
                return tex;
            }

            static createWoodenCrateTexture() {
                const canvas = document.createElement('canvas');
                canvas.width = 512;
                canvas.height = 512;
                const ctx = canvas.getContext('2d');

                ctx.fillStyle = '#8d633a';
                ctx.fillRect(0, 0, 512, 512);

                // Detailed wood planks with knots & grain lines
                for (let i = 0; i < 8; i++) {
                    const y = i * 64;
                    ctx.fillStyle = i % 2 === 0 ? '#875e36' : '#966b40';
                    ctx.fillRect(0, y, 512, 61);
                    ctx.fillStyle = '#382411';
                    ctx.fillRect(0, y + 61, 512, 3);

                    // Wood grain fibers
                    ctx.strokeStyle = 'rgba(55, 35, 15, 0.22)';
                    ctx.lineWidth = 1.5;
                    for (let g = 0; g < 6; g++) {
                        ctx.beginPath();
                        ctx.moveTo(0, y + 8 + g * 9);
                        ctx.bezierCurveTo(170, y + g * 11, 340, y + 14 + g * 7, 512, y + 8 + g * 9);
                        ctx.stroke();
                    }
                }

                // Outer reinforcement timber frame & diagonal slats
                ctx.strokeStyle = '#5e3f22';
                ctx.lineWidth = 38;
                ctx.strokeRect(19, 19, 474, 474);

                ctx.beginPath();
                ctx.moveTo(22, 22); ctx.lineTo(490, 490);
                ctx.moveTo(490, 22); ctx.lineTo(22, 490);
                ctx.stroke();

                // Heavy bolted steel corner plates
                ctx.fillStyle = '#22272c';
                [[0,0],[440,0],[0,440],[440,440]].forEach(([x,y]) => {
                    ctx.fillRect(x, y, 72, 72);
                    ctx.fillStyle = '#7f8c8d';
                    ctx.beginPath();
                    ctx.arc(x + 20, y + 20, 5, 0, Math.PI * 2);
                    ctx.arc(x + 52, y + 52, 5, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = '#22272c';
                });

                // Military spec stencil plate
                ctx.fillStyle = 'rgba(20, 24, 28, 0.88)';
                ctx.fillRect(110, 224, 292, 64);
                ctx.fillStyle = '#ffb703';
                ctx.font = 'bold 28px Rajdhani, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('ORDNANCE // 7.62 NATO', 256, 265);

                const tex = new THREE.CanvasTexture(canvas);
                tex.normalMap = this.generateNormalMapFromCanvas(canvas, 3.0);
                return tex;
            }

            static createContainerTexture(baseHex = '#b8323c', stripeHex = '#ece8e1') {
                const canvas = document.createElement('canvas');
                canvas.width = 512;
                canvas.height = 512;
                const ctx = canvas.getContext('2d');

                ctx.fillStyle = baseHex;
                ctx.fillRect(0, 0, 512, 512);

                // Deep 3D corrugated steel ribs
                for (let x = 0; x < 512; x += 16) {
                    const ribGrad = ctx.createLinearGradient(x, 0, x + 16, 0);
                    ribGrad.addColorStop(0, 'rgba(0,0,0,0.38)');
                    ribGrad.addColorStop(0.5, 'rgba(255,255,255,0.18)');
                    ribGrad.addColorStop(1, 'rgba(0,0,0,0.38)');
                    ctx.fillStyle = ribGrad;
                    ctx.fillRect(x, 0, 16, 512);
                }

                // Weathering & edge rust
                ctx.fillStyle = 'rgba(45, 25, 15, 0.35)';
                ctx.fillRect(0, 0, 512, 26);
                ctx.fillRect(0, 486, 512, 26);

                // Logistics markings
                ctx.fillStyle = stripeHex;
                ctx.fillRect(0, 380, 512, 48);
                ctx.fillStyle = '#0f1923';
                ctx.font = 'bold 30px Rajdhani, sans-serif';
                ctx.fillText('KNG-LOGISTICS // UNIT 09', 28, 414);

                const tex = new THREE.CanvasTexture(canvas);
                tex.wrapS = THREE.RepeatWrapping;
                tex.wrapT = THREE.RepeatWrapping;
                tex.normalMap = this.generateNormalMapFromCanvas(canvas, 3.4);
                return tex;
            }
        }

        /**
         * ============================================================================
         * 3. MODULAR TACTICAL FPS MAP BUILDER (AAA Mimari & Detaylı Çevre Tasarımı)
         * ============================================================================
         */
        class TacticalMapBuilder {
            constructor(scene) {
                this.scene = scene;
                this.colliders = []; // AABB fizik kutuları: { min: Vector3, max: Vector3, tag: string }
                this.meshes = [];    // Raycast (mermi izi) için tüm statik mesh'ler
                this.animatedProps = [];
                this.lights = {};

                // High-Resolution Procedural PBR Materials with Normal Maps
                const wallTex = ProceduralTextureEngine.createSandstoneWallTexture();
                const plasterWarmTex = ProceduralTextureEngine.createPlasterFacadeTexture('#e6d7c3', '#a84232');
                const plasterTealTex = ProceduralTextureEngine.createPlasterFacadeTexture('#dcd6cc', '#1d6b72');
                const floorTex = ProceduralTextureEngine.createTacticalFloorTexture();
                const radCrateTex = ProceduralTextureEngine.createRadianiteCrateTexture();
                const woodCrateTex = ProceduralTextureEngine.createWoodenCrateTexture();
                const redContTex = ProceduralTextureEngine.createContainerTexture('#a82832', '#ece8e1');
                const blueContTex = ProceduralTextureEngine.createContainerTexture('#1b4965', '#00f5d4');

                this.materials = {
                    floor: new THREE.MeshStandardMaterial({
                        map: floorTex,
                        normalMap: floorTex.normalMap,
                        normalScale: new THREE.Vector2(0.65, 0.65),
                        roughness: 0.78,
                        metalness: 0.08
                    }),
                    wall: new THREE.MeshStandardMaterial({
                        map: wallTex,
                        normalMap: wallTex.normalMap,
                        normalScale: new THREE.Vector2(0.85, 0.85),
                        roughness: 0.72,
                        metalness: 0.06
                    }),
                    plasterWarm: new THREE.MeshStandardMaterial({
                        map: plasterWarmTex,
                        normalMap: plasterWarmTex.normalMap,
                        roughness: 0.8,
                        metalness: 0.04
                    }),
                    plasterTeal: new THREE.MeshStandardMaterial({
                        map: plasterTealTex,
                        normalMap: plasterTealTex.normalMap,
                        roughness: 0.8,
                        metalness: 0.04
                    }),
                    concreteDark: new THREE.MeshStandardMaterial({
                        color: 0x26303a,
                        roughness: 0.55,
                        metalness: 0.35
                    }),
                    concreteLight: new THREE.MeshStandardMaterial({
                        color: 0xd6cfc2,
                        roughness: 0.65,
                        metalness: 0.12
                    }),
                    terracottaTile: new THREE.MeshStandardMaterial({
                        color: 0xa44a3f,
                        roughness: 0.6,
                        metalness: 0.1
                    }),
                    woodDark: new THREE.MeshStandardMaterial({
                        color: 0x4a321f,
                        roughness: 0.75,
                        metalness: 0.08
                    }),
                    sandbag: new THREE.MeshStandardMaterial({
                        color: 0xb8a382,
                        roughness: 0.92,
                        metalness: 0.02
                    }),
                    steelProp: new THREE.MeshStandardMaterial({
                        color: 0x3d4852,
                        roughness: 0.35,
                        metalness: 0.75
                    }),
                    hazardBarrel: new THREE.MeshStandardMaterial({
                        color: 0xd97706,
                        roughness: 0.4,
                        metalness: 0.6
                    }),
                    foliage: new THREE.MeshStandardMaterial({
                        color: 0x2d5a3c,
                        roughness: 0.85,
                        metalness: 0.05
                    }),
                    windowGlass: new THREE.MeshStandardMaterial({
                        color: 0x132a3e,
                        roughness: 0.15,
                        metalness: 0.9,
                        emissive: 0x091926,
                        emissiveIntensity: 0.4
                    }),
                    awningRed: new THREE.MeshStandardMaterial({
                        color: 0xb53838,
                        roughness: 0.85,
                        metalness: 0.05
                    }),
                    awningTeal: new THREE.MeshStandardMaterial({
                        color: 0x16697a,
                        roughness: 0.85,
                        metalness: 0.05
                    }),
                    radianiteCrate: new THREE.MeshStandardMaterial({
                        map: radCrateTex,
                        normalMap: radCrateTex.normalMap,
                        roughness: 0.28,
                        metalness: 0.65,
                        emissive: new THREE.Color(0x006655),
                        emissiveIntensity: 0.45
                    }),
                    woodCrate: new THREE.MeshStandardMaterial({
                        map: woodCrateTex,
                        normalMap: woodCrateTex.normalMap,
                        roughness: 0.75,
                        metalness: 0.12
                    }),
                    containerRed: new THREE.MeshStandardMaterial({
                        map: redContTex,
                        normalMap: redContTex.normalMap,
                        roughness: 0.45,
                        metalness: 0.55
                    }),
                    containerBlue: new THREE.MeshStandardMaterial({
                        map: blueContTex,
                        normalMap: blueContTex.normalMap,
                        roughness: 0.45,
                        metalness: 0.55
                    }),
                    neonTeal: new THREE.MeshBasicMaterial({ color: 0x00f5d4 }),
                    neonRed: new THREE.MeshBasicMaterial({ color: 0xff4655 }),
                    neonAmber: new THREE.MeshBasicMaterial({ color: 0xffb703 })
                };

                // Tactical Callout 3D World Positions
                this.callouts = [
                    { name: 'A SITE // REAKTÖR AVLUSU', pos: new THREE.Vector3(-30, 5.5, -18), color: '#ff4655' },
                    { name: 'A HEAVEN // KULE BALKONU', pos: new THREE.Vector3(-30, 9.5, -36), color: '#00f5d4' },
                    { name: 'MID // PAZAR MEYDANI', pos: new THREE.Vector3(0, 5.2, 2), color: '#ffb703' },
                    { name: 'MID KEMERLER (ARCH)', pos: new THREE.Vector3(-14, 6.2, -2), color: '#ece8e1' },
                    { name: 'B SITE // KARGO TERMİNALİ', pos: new THREE.Vector3(30, 5.8, -16), color: '#ff4655' },
                    { name: 'B GEÇİDİ // PERGOLA', pos: new THREE.Vector3(14, 6.2, 0), color: '#00f5d4' },
                    { name: 'SALDIRI BAŞLANGIÇ (T-SPAWN)', pos: new THREE.Vector3(0, 4.5, 38), color: '#ff4655' },
                    { name: 'SAVUNMA BAŞLANGIÇ (CT-SPAWN)', pos: new THREE.Vector3(0, 4.5, -38), color: '#00f5d4' }
                ];

                this.spawns = {
                    mid: new THREE.Vector3(0, 1.8, 22),
                    siteA: new THREE.Vector3(-28, 1.8, 6),
                    siteB: new THREE.Vector3(28, 1.8, 8),
                    aHeaven: new THREE.Vector3(-30, 6.3, -34),
                    ctSpawn: new THREE.Vector3(0, 1.8, -36)
                };
            }

            addBox(x, y, z, w, h, d, material, addCollider = true, castShadow = true, tag = 'structure') {
                const geo = new THREE.BoxGeometry(w, h, d);
                const mesh = new THREE.Mesh(geo, material);
                mesh.position.set(x, y + h / 2, z);
                mesh.castShadow = castShadow;
                mesh.receiveShadow = true;
                mesh.userData.boxDims = { w, h, d, tag };
                this.scene.add(mesh);
                this.meshes.push(mesh);

                if (addCollider) {
                    this.colliders.push({
                        min: new THREE.Vector3(x - w / 2, y, z - d / 2),
                        max: new THREE.Vector3(x + w / 2, y + h, z + d / 2),
                        tag
                    });
                }
                return mesh;
            }

            // Creates a true curved stone archway with segmented voussoirs, keystone, column bases & capitals
            addArchway(x, z, width, height, depth, rotationY = 0) {
                const isRotated = Math.abs(rotationY) > 0.1;
                const pillarW = 1.75;
                const openingW = width - pillarW * 2;
                const radius = openingW / 2;
                const springY = height - radius - 1.2;

                const px = isRotated ? 0 : (openingW / 2 + pillarW / 2);
                const pz = isRotated ? (openingW / 2 + pillarW / 2) : 0;
                const pw = isRotated ? depth : pillarW;
                const pd = isRotated ? pillarW : depth;

                // Left & Right Stone Columns + Plinth Bases + Molded Capitals
                this.addBox(x - px, 0, z - pz, pw * 1.18, 0.65, pd * 1.18, this.materials.concreteDark, false);
                this.addBox(x + px, 0, z + pz, pw * 1.18, 0.65, pd * 1.18, this.materials.concreteDark, false);
                this.addBox(x - px, 0, z - pz, pw, height, pd, this.materials.wall, true);
                this.addBox(x + px, 0, z + pz, pw, height, pd, this.materials.wall, true);
                this.addBox(x - px, springY - 0.35, z - pz, pw * 1.22, 0.4, pd * 1.22, this.materials.concreteLight, false);
                this.addBox(x + px, springY - 0.35, z + pz, pw * 1.22, 0.4, pd * 1.22, this.materials.concreteLight, false);

                // Curved Voussoir Arch Segments & Central Keystone
                const segments = 9;
                for (let i = 0; i < segments; i++) {
                    const t = (i + 0.5) / segments;
                    const angle = t * Math.PI;
                    const archOffset = Math.cos(angle) * (radius - 0.2);
                    const archY = springY + Math.sin(angle) * (radius - 0.2);
                    const isKeystone = i === Math.floor(segments / 2);
                    const segW = (Math.PI * radius) / segments + 0.25;
                    const segH = isKeystone ? 1.35 : 1.05;

                    const voxel = new THREE.Mesh(
                        new THREE.BoxGeometry(isRotated ? depth * 1.06 : segW, segH, isRotated ? segW : depth * 1.06),
                        isKeystone ? this.materials.concreteDark : this.materials.concreteLight
                    );
                    voxel.position.set(
                        x + (isRotated ? 0 : archOffset),
                        archY,
                        z + (isRotated ? archOffset : 0)
                    );
                    if (isRotated) voxel.rotation.x = angle - Math.PI / 2;
                    else voxel.rotation.z = -(angle - Math.PI / 2);
                    voxel.castShadow = true;
                    voxel.receiveShadow = true;
                    this.scene.add(voxel);
                    this.meshes.push(voxel);
                }

                // Upper Spandrel Beam & Cornice Crown
                const hw = isRotated ? depth : width;
                const hd = isRotated ? width : depth;
                this.addBox(x, height - 1.1, z, hw, 1.1, hd, this.materials.wall, true);
                this.addBox(x, height, z, hw + 0.5, 0.45, hd + 0.5, this.materials.concreteDark, false);
                this.addBox(x, height - 1.18, z, hw * 0.92, 0.12, hd * 0.92, this.materials.neonTeal, false, false);
            }

            // Detailed Standoff 2 / Bind style multi-story building facade outside/around the arena
            addDetailedBuildingFacade(x, y, z, w, h, d, mat, hasAwning = true, awningMat = null) {
                // Main building volume
                this.addBox(x, y, z, w, h, d, mat, true);
                // Roof cornice & parapet ledge
                this.addBox(x, y + h, z, w + 0.6, 0.55, d + 0.6, this.materials.concreteDark, false);
                this.addBox(x, y + h + 0.55, z, w - 0.4, 0.65, d - 0.4, this.materials.terracottaTile, false);

                // Recessed Windows with wooden shutters & sills along longest horizontal face
                const alongX = w >= d;
                const span = alongX ? w : d;
                const winCount = Math.max(1, Math.floor(span / 5.5));
                const step = span / (winCount + 1);

                for (let i = 1; i <= winCount; i++) {
                    const offset = -span / 2 + i * step;
                    const wx = alongX ? x + offset : x + (x > 0 ? -d / 2 - 0.08 : d / 2 + 0.08);
                    const wz = alongX ? z + (z > 0 ? -d / 2 - 0.08 : d / 2 + 0.08) : z + offset;
                    const winW = alongX ? 1.5 : 0.22;
                    const winD = alongX ? 0.22 : 1.5;

                    // Upper story window + frame + sill
                    const wy = y + h * 0.58;
                    this.addBox(wx, wy, wz, winW, 2.1, winD, this.materials.windowGlass, false, false);
                    this.addBox(wx, wy - 0.18, wz, winW * 1.25, 0.18, winD * 1.25, this.materials.concreteLight, false);

                    // Exterior HVAC / Air Conditioner Unit next to alternating windows
                    if (i % 2 === 1) {
                        const acX = alongX ? wx + 1.35 : wx;
                        const acZ = alongX ? wz : wz + 1.35;
                        this.addBox(acX, wy + 0.2, acZ, 0.85, 0.65, 0.55, this.materials.steelProp, false);
                    }
                }

                // Sloped fabric market awning + timber support struts
                if (hasAwning) {
                    const aMat = awningMat || this.materials.awningRed;
                    const awX = alongX ? x : x + (x > 0 ? -d / 2 - 1.2 : d / 2 + 1.2);
                    const awZ = alongX ? z + (z > 0 ? -d / 2 - 1.2 : d / 2 + 1.2) : z;
                    const awW = alongX ? w * 0.75 : 2.4;
                    const awD = alongX ? 2.4 : d * 0.75;
                    this.addBox(awX, y + 3.4, awZ, awW, 0.25, awD, aMat, false);
                    this.addBox(awX, y + 3.15, awZ, awW * 0.96, 0.18, awD * 0.96, this.materials.woodDark, false);
                }
            }

            // Wooden overhead sun-shade pergola beams (classic Standoff 2 Sandstone & Valorant Bind detail)
            addOverheadPergola(x, y, z, width, length, beamCount = 8, alongX = true) {
                // Side support rails
                if (alongX) {
                    this.addBox(x, y, z - length / 2, width, 0.25, 0.3, this.materials.woodDark, false);
                    this.addBox(x, y, z + length / 2, width, 0.25, 0.3, this.materials.woodDark, false);
                    for (let i = 0; i < beamCount; i++) {
                        const bx = x - width / 2 + (i + 0.5) * (width / beamCount);
                        this.addBox(bx, y + 0.2, z, 0.22, 0.22, length + 0.4, this.materials.woodDark, false);
                    }
                } else {
                    this.addBox(x - width / 2, y, z, 0.3, 0.25, length, this.materials.woodDark, false);
                    this.addBox(x + width / 2, y, z, 0.3, 0.25, length, this.materials.woodDark, false);
                    for (let i = 0; i < beamCount; i++) {
                        const bz = z - length / 2 + (i + 0.5) * (length / beamCount);
                        this.addBox(x, y + 0.2, bz, width + 0.4, 0.22, 0.22, this.materials.woodDark, false);
                    }
                }
            }

            // Curved sandbag tactical barricade
            addSandbagBarricade(x, y, z, rotationY = 0) {
                const isRot = Math.abs(rotationY) > 0.5;
                const w = isRot ? 0.95 : 3.2;
                const d = isRot ? 3.2 : 0.95;
                // Collider for the whole barricade
                this.colliders.push({
                    min: new THREE.Vector3(x - w / 2, y, z - d / 2),
                    max: new THREE.Vector3(x + w / 2, y + 1.25, z + d / 2),
                    tag: 'sandbag'
                });

                // Individual stacked sandbags
                for (let row = 0; row < 3; row++) {
                    const count = 3 - (row === 2 ? 1 : 0);
                    for (let c = 0; c < count; c++) {
                        const offset = (c - (count - 1) / 2) * 0.98;
                        const sx = x + (isRot ? 0 : offset);
                        const sz = z + (isRot ? offset : 0);
                        const sy = y + row * 0.38;
                        this.addBox(
                            sx, sy, sz,
                            isRot ? 0.85 : 0.92,
                            0.36,
                            isRot ? 0.92 : 0.85,
                            this.materials.sandbag,
                            false
                        );
                    }
                }
            }

            // Industrial explosive/oil drum cluster
            addBarrelCluster(x, y, z) {
                const offsets = [[0, 0], [0.95, 0.2], [0.45, 0.88]];
                offsets.forEach(([ox, oz], idx) => {
                    const mat = idx === 0 ? this.materials.hazardBarrel : this.materials.steelProp;
                    const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 1.35, 14), mat);
                    cyl.position.set(x + ox, y + 0.675, z + oz);
                    cyl.castShadow = true;
                    cyl.receiveShadow = true;
                    this.scene.add(cyl);
                    this.meshes.push(cyl);
                });
                this.colliders.push({
                    min: new THREE.Vector3(x - 0.45, y, z - 0.45),
                    max: new THREE.Vector3(x + 1.4, y + 1.4, z + 1.35),
                    tag: 'barrels'
                });
            }

            // Mediterranean Cypress / Palm Tree in stone planter box
            addPlanterTree(x, y, z) {
                // Stone planter base
                this.addBox(x, y, z, 2.2, 0.85, 2.2, this.materials.concreteDark, true);
                this.addBox(x, y + 0.85, z, 2.4, 0.18, 2.4, this.materials.concreteLight, false);
                // Trunk
                this.addBox(x, y + 1.0, z, 0.45, 2.6, 0.45, this.materials.woodDark, false);
                // Layered Cypress / Mediterranean canopy
                this.addBox(x, y + 3.2, z, 1.9, 2.4, 1.9, this.materials.foliage, false);
                this.addBox(x, y + 5.4, z, 1.35, 2.0, 1.35, this.materials.foliage, false);
                this.addBox(x, y + 7.2, z, 0.75, 1.4, 0.75, this.materials.foliage, false);
            }

            // Creates a Bomb Plant Zone with glowing tactical borders, Radianite conduits, and rotating beacon
            addBombSiteZone(x, z, width, depth, label, accentMat) {
                // Raised tactical steel-rimmed platform pad
                this.addBox(x, 0, z, width, 0.14, depth, this.materials.concreteDark, false, false);
                this.addBox(x, 0.14, z, width - 1.4, 0.04, depth - 1.4, this.materials.floor, false, false);

                // Glowing corner chevrons & perimeter strips
                const borderT = 0.24;
                this.addBox(x, 0.15, z - depth / 2, width, 0.06, borderT, accentMat, false, false);
                this.addBox(x, 0.15, z + depth / 2, width, 0.06, borderT, accentMat, false, false);
                this.addBox(x - width / 2, 0.15, z, borderT, 0.06, depth, accentMat, false, false);
                this.addBox(x + width / 2, 0.15, z, borderT, 0.06, depth, accentMat, false, false);

                // Floating Holographic Site Crystal + Orbital Ring
                const crystalGeo = new THREE.OctahedronGeometry(0.9, 0);
                const crystal = new THREE.Mesh(crystalGeo, accentMat);
                crystal.position.set(x, 7.2, z);
                this.scene.add(crystal);
                this.animatedProps.push({ mesh: crystal, type: 'spin', baseY: 7.2 });
            }

            // Surrounds the map with a realistic procedural sky dome & distant mountain/city silhouette
            createSkyDome() {
                const canvas = document.createElement('canvas');
                canvas.width = 1024;
                canvas.height = 512;
                const ctx = canvas.getContext('2d');

                const skyGrad = ctx.createLinearGradient(0, 0, 0, 512);
                skyGrad.addColorStop(0, '#0f172a');
                skyGrad.addColorStop(0.42, '#334155');
                skyGrad.addColorStop(0.68, '#c26d48');
                skyGrad.addColorStop(0.82, '#f4a261');
                skyGrad.addColorStop(1, '#2b2320');
                ctx.fillStyle = skyGrad;
                ctx.fillRect(0, 0, 1024, 512);

                // Glowing sun disc on horizon
                const sunGrad = ctx.createRadialGradient(740, 310, 8, 740, 310, 130);
                sunGrad.addColorStop(0, 'rgba(255, 250, 220, 1)');
                sunGrad.addColorStop(0.3, 'rgba(255, 180, 90, 0.65)');
                sunGrad.addColorStop(1, 'rgba(255, 120, 50, 0)');
                ctx.fillStyle = sunGrad;
                ctx.fillRect(580, 160, 320, 300);

                // Distant mountain ridge silhouette
                ctx.fillStyle = '#1c191f';
                ctx.beginPath();
                ctx.moveTo(0, 512);
                ctx.lineTo(0, 375);
                for (let x = 0; x <= 1024; x += 32) {
                    const y = 370 + Math.sin(x * 0.018) * 28 + Math.cos(x * 0.045) * 14;
                    ctx.lineTo(x, y);
                }
                ctx.lineTo(1024, 512);
                ctx.closePath();
                ctx.fill();

                const skyTex = new THREE.CanvasTexture(canvas);
                const domeGeo = new THREE.SphereGeometry(165, 32, 20);
                const domeMat = new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false });
                this.skyDome = new THREE.Mesh(domeGeo, domeMat);
                this.scene.add(this.skyDome);
            }

            buildFullCompetitiveMap() {
                this.createSkyDome();

                // 1. Base Cobblestone & Sandstone Courtyard Ground Plane (110m x 110m)
                const groundGeo = new THREE.PlaneGeometry(110, 110);
                const ground = new THREE.Mesh(groundGeo, this.materials.floor);
                ground.rotation.x = -Math.PI / 2;
                ground.receiveShadow = true;
                this.scene.add(ground);
                this.meshes.push(ground);

                // 2. Outer Perimeter Fortress Walls + Detailed Multi-Story Mediterranean / Industrial Buildings
                const wallH = 11.5;
                this.addBox(0, 0, -48, 96, wallH, 3, this.materials.wall); // North Wall (CT Side)
                this.addBox(0, 0, 48, 96, wallH, 3, this.materials.wall);  // South Wall (T Side)
                this.addBox(-48, 0, 0, 3, wallH, 96, this.materials.wall); // West Wall (Site A Side)
                this.addBox(48, 0, 0, 3, wallH, 96, this.materials.wall);  // East Wall (Site B Side)

                // Architectural Battlements, Corner Watchtowers, and Skyline Building Facades
                this.addDetailedBuildingFacade(-30, wallH, -51, 32, 8.5, 6, this.materials.plasterWarm, false);
                this.addDetailedBuildingFacade(28, wallH, -51, 34, 9.5, 6, this.materials.plasterTeal, false);
                this.addDetailedBuildingFacade(-51, wallH, -18, 6, 9.0, 36, this.materials.plasterWarm, false);
                this.addDetailedBuildingFacade(51, wallH, -16, 6, 8.0, 38, this.materials.concreteDark, false);

                // 3. LANE DIVIDERS (Multi-Story Kasbah & Plaza Buildings with Windows, Awnings & AC Units)
                // Left Divider Buildings (Separating Mid Plaza from Site A)
                this.addDetailedBuildingFacade(-14, 0, 14, 4.4, 9.2, 22, this.materials.plasterWarm, true, this.materials.awningRed);
                this.addArchway(-14, -2, 10, 9.2, 4.0, Math.PI / 2); // Mid-to-A Stone Arch Connector
                this.addDetailedBuildingFacade(-14, 0, -16, 4.4, 9.2, 16, this.materials.wall, true, this.materials.awningTeal);

                // Right Divider Buildings (Separating Mid Plaza from Site B)
                this.addDetailedBuildingFacade(14, 0, 16, 4.4, 9.2, 20, this.materials.plasterTeal, true, this.materials.awningTeal);
                this.addArchway(14, 0, 10, 9.2, 4.0, Math.PI / 2); // Mid-to-B Stone Arch Connector
                this.addDetailedBuildingFacade(14, 0, -16, 4.4, 9.2, 18, this.materials.wall, true, this.materials.awningRed);

                // Overhead Wooden Sun-Shade Pergolas in Mid & Connectors
                this.addOverheadPergola(0, 8.6, 12, 23, 8, 9, true);
                this.addOverheadPergola(-21, 7.8, -2, 9, 7, 6, false);

                // 4. MID COURTYARD (Octagonal Stone Fountain Monument, Market Crates, Sandbags & Arch Gate)
                // Octagonal Fountain Basin + Obelisk Spire + Glowing Radianite Water Pool
                this.addBox(0, 0, 2, 5.4, 0.85, 5.4, this.materials.concreteDark);
                this.addBox(0, 0.85, 2, 4.6, 0.15, 4.6, this.materials.neonTeal, false, false);
                this.addBox(0, 1.0, 2, 2.3, 4.2, 2.3, this.materials.wall);
                this.addBox(0, 5.2, 2, 2.7, 0.45, 2.7, this.materials.concreteLight, false);
                this.addBox(0, 5.65, 2, 1.4, 1.6, 1.4, this.materials.radianiteCrate, false);

                // Mid Top Archway (Defender Mid Gate)
                this.addArchway(0, -18, 14, 9.5, 4.0, 0);

                // Mid Tactical Cover Crates, Sandbags & Barrel Clusters
                this.addBox(-5.8, 0, 11, 2.2, 2.2, 2.2, this.materials.woodCrate);
                this.addSandbagBarricade(-5.8, 0, 13.6, 0);
                this.addBox(6.0, 0, -7, 2.4, 2.4, 2.4, this.materials.radianiteCrate);
                this.addBox(6.0, 2.4, -7, 2.0, 2.0, 2.0, this.materials.woodCrate);
                this.addBarrelCluster(-6.5, 0, -9.5);
                this.addPlanterTree(8.5, 0, 18);
                this.addPlanterTree(-8.5, 0, -24);

                // 5. SITE A (WEST WING - Kingdom Radianite Reactor Plaza & A-Heaven Balcony Tower)
                this.addBombSiteZone(-30, -18, 15.5, 15.5, 'SITE A', this.materials.neonRed);

                // Central Reactor Containment Core on Site A (Multi-tier Radianite Turbine + Steel Pipes)
                this.addBox(-30, 0, -18, 3.4, 3.4, 3.4, this.materials.radianiteCrate);
                this.addBox(-30, 3.4, -18, 2.7, 2.8, 2.7, this.materials.radianiteCrate);
                this.addBox(-30, 6.2, -18, 3.2, 0.55, 3.2, this.materials.steelProp, false);
                this.addBox(-26.5, 0, -15.5, 2.2, 2.2, 2.2, this.materials.woodCrate);
                this.addSandbagBarricade(-34.5, 0, -13.0, 0);

                // A-Long Tactical Choke Wall, Archway & Peek Angle
                this.addDetailedBuildingFacade(-36, 0, 8, 16, 8.2, 2.8, this.materials.plasterWarm, true, this.materials.awningRed);
                this.addBox(-23, 0, 2, 2.4, 2.4, 2.4, this.materials.woodCrate);
                this.addBarrelCluster(-25.8, 0, 2.2);
                this.addPlanterTree(-41, 0, -4);

                // A-HEAVEN Elevated Balcony Platform (Height = 4.5m) with Pillars, Roof Overhang & Head-Glitch Cover
                this.addBox(-30, 4.2, -36, 22, 0.65, 12, this.materials.concreteDark);
                // Support columns beneath A-Heaven
                this.addBox(-39, 0, -31, 1.4, 4.2, 1.4, this.materials.concreteDark);
                this.addBox(-21, 0, -31, 1.4, 4.2, 1.4, this.materials.concreteDark);
                // Crenellated Heaven Half-Wall Railing & Tactical Sandbags
                this.addBox(-35, 4.85, -30.3, 10, 1.35, 0.55, this.materials.wall);
                this.addBox(-23, 4.85, -30.3, 6, 1.35, 0.55, this.materials.wall);
                this.addBox(-30, 9.2, -36, 22.6, 0.6, 12.6, this.materials.terracottaTile, false);

                // Stepped Tactical Stone Ramp with Steel Handrail up to A-Heaven
                const steps = 10;
                for (let i = 0; i < steps; i++) {
                    const stepH = (i + 1) * (4.5 / steps);
                    this.addBox(-17.5, 0, -24.5 - i * 1.15, 3.8, stepH, 1.2, this.materials.concreteLight);
                }
                this.addBox(-19.5, 0, -30, 0.25, 5.6, 11.5, this.materials.steelProp, false);

                // 6. SITE B (EAST WING - Industrial Cargo Warehouse & Gantry Crane)
                this.addBombSiteZone(30, -16, 15.5, 15.5, 'SITE B', this.materials.neonTeal);

                // Stacked Corrugated Cargo Containers with Open Door Frame Details
                this.addBox(30, 0, -16, 4.2, 3.6, 9.6, this.materials.containerRed);
                this.addBox(30, 3.6, -17.5, 4.0, 3.4, 6.6, this.materials.containerBlue);

                // Overhead Industrial Steel Gantry Crane spanning B-Site
                this.addBox(21, 0, -16, 1.2, 9.8, 1.2, this.materials.steelProp);
                this.addBox(42, 0, -16, 1.2, 9.8, 1.2, this.materials.steelProp);
                this.addBox(31.5, 9.4, -16, 22.5, 0.9, 1.4, this.materials.hazardBarrel, false);

                // B-Site Back Pillar, Radianite Stash, Barrels & Sandbags
                this.addBox(39, 0, -24, 3.0, 8.8, 3.0, this.materials.concreteDark);
                this.addBox(24, 0, -23, 2.5, 2.5, 2.5, this.materials.radianiteCrate);
                this.addBox(36, 0, -6, 2.4, 2.4, 2.4, this.materials.woodCrate);
                this.addBox(36, 0, -3.4, 2.2, 2.2, 2.2, this.materials.woodCrate);
                this.addSandbagBarricade(24.5, 0, -8.5, Math.PI / 2);
                this.addBarrelCluster(35.5, 0, -22.5);

                // B-Long Entry Choke Building
                this.addDetailedBuildingFacade(35, 0, 10, 18, 8.2, 2.8, this.materials.plasterTeal, true, this.materials.awningTeal);

                // 7. SPAWN ZONES (Attacker & Defender Tactical Pavilions)
                this.addBox(0, 0, 32, 12, 3.4, 1.6, this.materials.concreteDark); // T-Spawn Protection Wall
                this.addOverheadPergola(0, 3.4, 34.5, 11.5, 4.5, 6, true);
                this.addBox(0, 0, -32, 12, 3.4, 1.6, this.materials.concreteDark); // CT-Spawn Protection Wall
                this.addOverheadPergola(0, 3.4, -34.5, 11.5, 4.5, 6, true);

                // Setup Default Atmosphere Lighting
                this.setupLighting();

                return {
                    colliders: this.colliders,
                    meshes: this.meshes,
                    spawns: this.spawns,
                    callouts: this.callouts
                };
            }

            setupLighting() {
                // Hemisphere ambient light
                this.lights.hemi = new THREE.HemisphereLight(0xffeedd, 0x2b3a4a, 0.65);
                this.scene.add(this.lights.hemi);

                // Primary Sun Light with High-Res Shadow Map
                this.lights.sun = new THREE.DirectionalLight(0xffb870, 1.25);
                this.lights.sun.position.set(45, 68, 35);
                this.lights.sun.castShadow = true;
                this.lights.sun.shadow.mapSize.width = 2048;
                this.lights.sun.shadow.mapSize.height = 2048;
                const d = 58;
                this.lights.sun.shadow.camera.left = -d;
                this.lights.sun.shadow.camera.right = d;
                this.lights.sun.shadow.camera.top = d;
                this.lights.sun.shadow.camera.bottom = -d;
                this.lights.sun.shadow.camera.near = 5;
                this.lights.sun.shadow.camera.far = 160;
                this.lights.sun.shadow.bias = -0.0005;
                this.scene.add(this.lights.sun);

                // Point lights over Bomb Sites A and B for dramatic glow
                this.lights.siteA = new THREE.PointLight(0xff4655, 1.6, 28);
                this.lights.siteA.position.set(-30, 7, -18);
                this.scene.add(this.lights.siteA);

                this.lights.siteB = new THREE.PointLight(0x00f5d4, 1.6, 28);
                this.lights.siteB.position.set(30, 7, -16);
                this.scene.add(this.lights.siteB);

                this.setAtmosphere('sunset');
            }

            setAtmosphere(mode) {
                if (mode === 'sunset') {
                    // Standoff 2 Sandstone Golden Hour
                    this.scene.background = new THREE.Color(0x1e293b);
                    this.scene.fog = new THREE.FogExp2(0x282326, 0.0075);
                    this.lights.sun.color.setHex(0xffa95e);
                    this.lights.sun.intensity = 1.3;
                    this.lights.hemi.color.setHex(0xffd6a5);
                    this.lights.hemi.groundColor.setHex(0x2b2d42);
                    this.lights.hemi.intensity = 0.65;
                } else if (mode === 'day') {
                    // Valorant Competitive High-Clarity Daylight
                    this.scene.background = new THREE.Color(0x6ec3f4);
                    this.scene.fog = new THREE.FogExp2(0x8ecae6, 0.0045);
                    this.lights.sun.color.setHex(0xffffff);
                    this.lights.sun.intensity = 1.35;
                    this.lights.hemi.color.setHex(0xffffff);
                    this.lights.hemi.groundColor.setHex(0x4a5759);
                    this.lights.hemi.intensity = 0.8;
                } else if (mode === 'cyber') {
                    // Valorant Night / Cyber Protocol
                    this.scene.background = new THREE.Color(0x070b12);
                    this.scene.fog = new THREE.FogExp2(0x070b12, 0.012);
                    this.lights.sun.color.setHex(0x3a86ff);
                    this.lights.sun.intensity = 0.55;
                    this.lights.hemi.color.setHex(0x00f5d4);
                    this.lights.hemi.groundColor.setHex(0x0f1923);
                    this.lights.hemi.intensity = 0.4;
                }
            }

            updateAnimations(time) {
                for (const item of this.animatedProps) {
                    if (item.type === 'spin') {
                        item.mesh.rotation.y = time * 1.6;
                        item.mesh.position.y = item.baseY + Math.sin(time * 2.5) * 0.35;
                    }
                }
            }
        }
