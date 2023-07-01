let renderer,
    scene,
    camera,
    sphereBg,
    sun,
    stars,
    controls,
    container = document.getElementById("canvas_container"),
    timeout_Debounce,
    noise = new SimplexNoise(),
    cameraSpeed = 0,
    blobScale = .8;

init();
animate();

var mercury;
var venus;
var earth;
var mars;
var jupyter;
var shipObj;
var pyramidObj;
var deathStar;

function init() {
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.01, 1000)
    camera.position.set(0, 0, 230);

    const pointLight = new THREE.PointLight(0xFFFFFF, 5, 300);
    scene.add(pointLight);
    
    renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
    });

    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.BasicShadowMap;

    container.appendChild(renderer.domElement);

    /* Orbit Controls */
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.autoRotate = true;
    controls.autoRotateSpeed = 3;
    controls.maxDistance = 600;
    controls.minDistance = 150;
    controls.enablePan = false;

    const loader = new THREE.TextureLoader();
    const assetLoader = new THREE.GLTFLoader();

    const textureSphereBg = loader.load('https://i.ibb.co/4gHcRZD/bg3-je3ddz.jpg');        
    const textureStar1 = loader.load("https://i.ibb.co/ZKsdYSz/p1-g3zb2a.png");
    const textureStar2 = loader.load("https://i.ibb.co/F8by6wW/p2-b3gnym.png");
    const textureStar3 = loader.load("https://i.ibb.co/yYS2yx5/p3-ttfn70.png");
    const textureGalaxy = loader.load("https://i.ibb.co/yWfKkHh/p4-avirap.png");

    const sunTexture = loader.load("https://i.ibb.co/bXPNqwW/sun.jpg");
    const mercuryTexture = loader.load("https://i.ibb.co/PQ2YTbg/mercury.jpg");
    const venusTexture = loader.load("https://i.ibb.co/vcXpsdD/venus.jpg");
    const earthTexture = loader.load("https://i.ibb.co/59Yrgqk/earth.png");
    const jupyterTexture = loader.load("https://i.ibb.co/d4ZTVwY/jupiter.png");
    const moonTexture = loader.load("https://i.ibb.co/fCyx3JD/moon.jpg");

    const shipModelUrl = '../models/ship/ship.glb';
    const pyrModelUrl = '../models/pyramid/pyramid.glb';
    const deathStarModelUrl = '../models/dstar/dstar.glb';

    /*  Sun  */
    sunTexture.anisotropy = 16;
    let icosahedronGeometry = new THREE.IcosahedronGeometry(40, 10);
    let lambertMaterial = new THREE.MeshBasicMaterial({ map: sunTexture });
    sun = new THREE.Mesh(icosahedronGeometry, lambertMaterial);
    scene.add(sun);

    function createPlanet(size, texture, x, y, z) {
        const geo = new THREE.IcosahedronGeometry(size, 30, 30);
        const mat = new THREE.MeshPhongMaterial({ map: texture, transparent: false });
        const mesh = new THREE.Mesh(geo, mat);
        const obj = new THREE.Object3D();

        obj.add(mesh);

        scene.add(obj);
        mesh.position.set(x, y, z);
        return { mesh, obj }
    }

    /*  Planets  */
    mercury = createPlanet(10, mercuryTexture, 100, 0, 0);
    venus = createPlanet(12, venusTexture, -120, 0, 0);
    earth = createPlanet(15, earthTexture, 140, 0, 0);
    jupyter = createPlanet(20, jupyterTexture, 160, 0, 0);


    /*  Earth rotation axis  */
    earth.mesh.rotateZ(0.5);

    const moonGeo = new THREE.IcosahedronGeometry(4.08, 30, 30);
    const moonMat = new THREE.MeshPhongMaterial({
        map: moonTexture, transparent: false
    });
    const moon = new THREE.Mesh(moonGeo, moonMat);
    const moonObj = new THREE.Object3D();
    moon.position.x = 25;
    earth.mesh.add(moonObj);
    moonObj.add(moon);


    const sunTorusGeos = [
        new THREE.TorusGeometry(100, 0.2, 20, 100),
        new THREE.TorusGeometry(120, 0.2, 20, 100),
        new THREE.TorusGeometry(140, 0.2, 20, 100),
        new THREE.TorusGeometry(160, 0.2, 20, 100)
    ];

    const sunTorusObj = new THREE.Object3D();
    const sunRingMat = new THREE.MeshBasicMaterial({
        side: THREE.DoubleSide,
        transparent: true
    });
    const sunRings = [];

    sunTorusGeos.forEach((torusGeo) => {
        const sunRing = new THREE.Mesh(torusGeo, sunRingMat);
        sunTorusObj.add(sunRing);
        sunRings.push(sunRing);
    });

    scene.add(sunTorusObj);

    setRotation(sunRings[0], -0.25 * Math.PI);
    setRotation(sunRings[2], 0.5 * Math.PI);
    setRotation(sunRings[3], -0.75 * Math.PI);

    const opacitySlider = document.getElementById('opacity-slider');
    opacitySlider.addEventListener('input', function () {
        const opacityValue = parseFloat(this.value);
        sunRings.forEach((sunRing) => {
            setOpacity(sunRing, opacityValue);
        });
    });

    function setRotation(object, rotationValue) {
        object.rotation.x = rotationValue;
    }

    function setOpacity(object, opacityValue) {
        object.material.opacity = opacityValue;
        object.material.transparent = opacityValue < 1;
    }


    /*    Sphere Background   */
    textureSphereBg.anisotropy = 16;
    let geometrySphereBg = new THREE.SphereBufferGeometry(200, 40, 40);
    let materialSphereBg = new THREE.MeshBasicMaterial({
        side: THREE.BackSide,
        map: textureSphereBg,
    });
    sphereBg = new THREE.Mesh(geometrySphereBg, materialSphereBg);
    scene.add(sphereBg);

    /* Sun Ship */
    shipObj = new THREE.Object3D();
    scene.add(shipObj)
    let shipModel;
    assetLoader.load(shipModelUrl, gltf => {
        shipModel = gltf.scene
        shipObj.add(shipModel)
        shipModel.position.x = 45
        shipModel.rotateX(3.1)
        shipModel.rotateZ(5)
        shipModel.scale.set(2, 2, 2)
    });


    /* Pyramid Vessels */
    const pyramidPositions = [
        { x: 170, y: 0, z: 0 },
        { x: 158, y: -10, z: 0 },
        { x: 182, y: 5, z: -5 }
    ];

    const pyramidScales = [
        { x: 0.08, y: 0.08, z: 0.08 },
        { x: 0.05, y: 0.05, z: 0.05 },
        { x: 0.05, y: 0.05, z: 0.05 }
    ];

    pyramidObj = new THREE.Object3D();
    scene.add(pyramidObj);

    pyramidPositions.forEach((position, index) => {
        assetLoader.load(pyrModelUrl, gltf => {
            const pyramid = gltf.scene;
            pyramid.position.set(position.x, position.y, position.z);
            pyramid.rotateY(25);
            pyramid.scale.set(pyramidScales[index].x, pyramidScales[index].y, pyramidScales[index].z);
            pyramidObj.add(pyramid);
        });
    });


    /* Death Star */
    deathStarObj = new THREE.Object3D();
    deathStarObj.rotateY(60);
    scene.add(deathStarObj)
    assetLoader.load(deathStarModelUrl, gltf => {
        deathStar = gltf.scene
        deathStarObj.add(deathStar)
        deathStar.position.x = 60
        deathStar.position.y = 30
        deathStar.scale.set(0.1, 0.1, 0.1)
    });


    /*    Moving Stars   */
    let starsGeometry = new THREE.Geometry();

    for (let i = 0; i < 50; i++) {
        let particleStar = randomPointSphere(150);

        particleStar.velocity = THREE.MathUtils.randInt(50, 200);

        particleStar.startX = particleStar.x;
        particleStar.startY = particleStar.y;
        particleStar.startZ = particleStar.z;

        starsGeometry.vertices.push(particleStar);
    }
    let starsMaterial = new THREE.PointsMaterial({
        size: 5,
        color: "#ffffff",
        transparent: true,
        opacity: 0.8,
        map: textureStar1,
        blending: THREE.AdditiveBlending,
    });
    starsMaterial.depthWrite = false;
    stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);


    /*    Fixed Stars   */
    function createStars(texture, size, total) {
        let pointGeometry = new THREE.Geometry();
        let pointMaterial = new THREE.PointsMaterial({
            size: size,
            map: texture,
            blending: THREE.AdditiveBlending,
        });

        for (let i = 0; i < total; i++) {
            let radius = THREE.MathUtils.randInt(149, 70);
            let particles = randomPointSphere(radius);
            pointGeometry.vertices.push(particles);
        }
        return new THREE.Points(pointGeometry, pointMaterial);
    }

    scene.add(createStars(textureStar2, 1, 20));
    scene.add(createStars(textureStar3, 5, 5));
    scene.add(createStars(textureGalaxy, 4, 5));


    function randomPointSphere(radius) {
        let theta = 2 * Math.PI * Math.random();
        let phi = Math.acos(2 * Math.random() - 1);
        let dx = 0 + (radius * Math.sin(phi) * Math.cos(theta));
        let dy = 0 + (radius * Math.sin(phi) * Math.sin(theta));
        let dz = 0 + (radius * Math.cos(phi));
        return new THREE.Vector3(dx, dy, dz);
    }
}


function animate() {

    //Stars  Animation
    stars.geometry.vertices.forEach(function (v) {
        v.x += (0 - v.x) / v.velocity;
        v.y += (0 - v.y) / v.velocity;
        v.z += (0 - v.z) / v.velocity;

        v.velocity -= 0.3;

        if (v.x <= 5 && v.x >= -5 && v.z <= 5 && v.z >= -5) {
            v.x = v.startX;
            v.y = v.startY;
            v.z = v.startZ;
            v.velocity = THREE.MathUtils.randInt(50, 300);
        }
    });


    //Nucleus Animation
    sun.geometry.vertices.forEach(function (v) {
        let time = Date.now();
        v.normalize();
        let distance = sun.geometry.parameters.radius + noise.noise3D(
            v.x + time * 0.0005,
            v.y + time * 0.0007,
            v.z + time * 0.0008
        ) * blobScale * 2.5;
        v.multiplyScalar(distance);
    })
    sun.geometry.verticesNeedUpdate = true;
    sun.geometry.normalsNeedUpdate = true;
    sun.geometry.computeVertexNormals();
    sun.geometry.computeFaceNormals();
    sun.rotateY(0.02);


    shipObj.rotateZ(0.03);

    mercury.obj.rotateY(0.01);
    mercury.obj.rotateZ(0.01);
    mercury.mesh.rotateY(0.04);


    jupyter.obj.rotateZ(0.015);
    jupyter.obj.rotateY(-0.015);
    jupyter.mesh.rotateY(0.01);

    venus.obj.rotateZ(0.01);
    venus.mesh.rotateY(0.04);


    earth.obj.rotateY(0.01);
    earth.mesh.rotateY(0.02);

    pyramidObj.rotateY(0.001);
    
    //Sphere Beckground Animation
    sphereBg.rotation.x += 0.002;
    sphereBg.rotation.y += 0.002;
    sphereBg.rotation.z += 0.002;


    controls.update();
    stars.geometry.verticesNeedUpdate = true;
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}


/*     Resize     */
window.addEventListener("resize", () => {
    clearTimeout(timeout_Debounce);
    timeout_Debounce = setTimeout(onWindowResize, 80);
});
function onWindowResize() {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}