$(function(){
  var doc = $(document), win = $(window);

  var scene, camera, renderer;
  var axis, color;
  var planeGeometry;
  var planeMaterial;
  var plane;
  var spotLight;
  var stats;
  var SCREEN_WIDTH = window.innerWidth;
  var SCREEN_HEIGHT = window.innerHeight;
  var projector;
  var mouse = { x: 0, y: 0 , clicked: false};
  var container = $("#webglcontainer")[0];
  var ray;
  var objects = new Array();
  /*creates empty scene object and renderer*/
  scene = new THREE.Scene();
  camera =  new THREE.PerspectiveCamera(45, SCREEN_WIDTH/SCREEN_HEIGHT, .1, 500);
  renderer = new THREE.WebGLRenderer({antialias:true});

  renderer.setClearColor(0xdddddd);
  renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
  renderer.shadowMapEnabled= true;
  renderer.shadowMapSoft = true;

  //Add stats
  stats = new Stats();
  stats.domElement.style.position = "absolute";
  stats.domElement.style.right = "0px";
  stats.domElement.style.top = "0px";

  container.appendChild(stats.domElement);

  projector = new THREE.Projector();

  /*add controls*/
  controls = new THREE.OrbitControls( camera, renderer.domElement );
  controls.addEventListener( 'change', render );

  /*adds helpers*/
  axis =  new THREE.AxisHelper(10);
  scene.add (axis);

  /*create plane*/
  planeGeometry = new THREE.PlaneGeometry (100,100,100);
  planeMaterial = new THREE.MeshPhongMaterial({color:0xffffff});
  plane = new THREE.Mesh(planeGeometry, planeMaterial);

  /*position and add objects to scene*/
  plane.rotation.x = -.5*Math.PI;
  plane.receiveShadow = true;
  scene.add(plane);

  camera.position.x = 40;
  camera.position.y = 40;
  camera.position.z = 40;
  camera.lookAt(scene.position);

  var vector = new THREE.Vector3( mouse.x, mouse.y, 0.5 );
  vector.unproject(camera);
  ray = new THREE.Raycaster( camera.position,
  vector.sub( camera.position ).normalize() );

  /*adds spot light with starting parameters*/
  spotLight = new THREE.SpotLight(0xffffff);
  spotLight.castShadow = true;
  spotLight.position.set (20, 35, 40);
  spotLight.intensity = 1;
  spotLight.distance = 0;
  spotLight.angle = 1.570;
  spotLight.exponent = 0;
  spotLight.shadowCameraNear = 10;
  spotLight.shadowCameraFar = 100;
  spotLight.shadowCameraFov = 50;
  spotLight.shadowCameraVisible = false;
  spotLight.shadowBias = 0;
  spotLight.shadowDarkness = 0.5;
  scene.add(spotLight);

  $("#webglcontainer").append(renderer.domElement);
  /*stats*/
  stats = new Stats();
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.top = '0px';
  $("#webGL-container").append( stats.domElement );

  function render() {

  }

  function animate(){
      requestAnimationFrame(animate);
      render();
      stats.update();
      updateControls();
      renderer.render(scene, camera);
  }

  function updateControls() {
    var vector = new THREE.Vector3( mouse.x, mouse.y, 0.5 );
    vector.unproject(camera);
    ray = new THREE.Raycaster( camera.position,
    vector.sub( camera.position ).normalize() );

    if (mouse.clicked)  {
      mouse.clicked = false;
      ray.setFromCamera(mouse, camera);
      var intersects = ray.intersectObjects(objects);
      if(intersects.length > 0) {
        OrbitControlMouseUp();
        // controls.noRotate = true;
        $('#operationModal').css('display','block');
        $('.operationModal-bg').fadeIn().find('input').eq(0).focus();
        doc.trigger('openModal');
      }
    }
  }

  doc.on('mousemove', onDocumentMouseMove);
  doc.on( 'mousedown', onDocumentMouseDown);

  function onDocumentMouseMove(event) {
    mouse.x = (event.clientX / SCREEN_WIDTH) * 2 -1;
    mouse.y = -(event.clientY / SCREEN_HEIGHT) * 2 + 1;
  }

  function onDocumentMouseDown(event) {
    mouse.x = ( event.clientX / SCREEN_WIDTH ) * 2 - 1;
    mouse.y = - ( event.clientY / SCREEN_HEIGHT ) * 2 + 1;
    mouse.clicked = true;
    // controls.noRotate = false;
  }

  function performOperation(deapthOfCut, feedLength){
    var clickedObject = scene.getObjectByName(objects[0].name);
    var oldParams = clickedObject.geometry.parameters;
    scene.remove(clickedObject);

    var cylinderOne = createNewGeometry(parseInt(oldParams.radiusBottom), parseInt(oldParams.radiusTop), oldParams.height - feedLength, 'geoOne');

    var cylinderTwo = createNewGeometry(parseInt(oldParams.radiusBottom - deapthOfCut), parseInt(oldParams.radiusTop - deapthOfCut), feedLength, 'geoTwo');
    scene.add(cylinderOne);
    scene.add(cylinderTwo);

    cylinderTwo.position.x = cylinderOne.geometry.parameters.height + cylinderTwo.geometry.parameters.height/2;
    cylinderTwo.position.y = parseInt(oldParams.radiusBottom);
    cylinderTwo.position.z = parseInt(oldParams.radiusBottom);

    var indexOne = objects.indexOf(cylinderOne);
    objects.splice(indexOne, 1);

    var indexTwo = objects.indexOf(cylinderTwo);
    objects.splice(indexTwo, 1);

    var outputString = [];

    outputString.push('00001');
    $.fn.write = function(str, delay){
            var len = str.length, i = 0, self = this;

            var interval = setInterval(function(){
                if(!str[i]) {clearInterval(interval)}
                else {self.html(str.substr(0, i++));}
            }, delay || 30)
            return self;
        }

    $('#code').write('O0001 <br/> \
  N5 M12 <br/> \
  N10 T0101 <br/> \
  N15 G0 X100 Z50 <br/> \
  N20 M3 S600 <br/> \
  N25 M8 <br/> \
  N30 G1 X50 Z0 F600 <br/> \
  N40 W-30 F200 <br/> \
  N50 X80 W-20 F150 <br/> \
  N60 G0 X100 Z50 <br/> \
  N70 T0100 <br/> \
  N80 M5 <br/> \
  N90 M9 <br/> \
  N100 M13 <br/> \
  N110 M30 <br/> \
  N120 %');

    return false;
  }

  $(window).resize(function(){
      SCREEN_WIDTH = window.innerWidth;
      SCREEN_HEIGHT = window.innerHeight;

      camera.aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
      camera.updateProjectionMatrix();

      renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );

  });
  animate();

  $('button[name="submitOperationParams"]').click(function(e){
    e.preventDefault();
    var deapthOfCut = $('#depth').val();
    var feedLength = $('#feedLength').val();
    performOperation(deapthOfCut, feedLength);
    $('.operationModal-bg').fadeOut();
    $('#operationModal').fadeOut();
    doc.trigger('closeModal');
    return false;
  });

  $('button[name="submitGeoParams"]').click(function(e){
    e.preventDefault();

    var bottomValue = $('#botRad').val();
    var topValue = $('#topRad').val();
    var height = $('#height').val();

    var cylinder = createNewGeometry(bottomValue, topValue, height, 'workpiece');
    scene.add( cylinder );
    $('.modal-bg').fadeOut();
    $('#modal').fadeOut();
    doc.trigger('closeModal');
    return false;
  });

  function createNewGeometry(radiusBottom, radiusTop, height, name) {
    var geometry = new THREE.CylinderGeometry(radiusBottom, radiusTop, height, 32);
    var material = new THREE.MeshLambertMaterial( {color: 0xffff00} );
    var cylinder = new THREE.Mesh( geometry, material );
    cylinder.name = name;

    cylinder.position.x = height/2;
    cylinder.position.y = radiusBottom;
    cylinder.position.z = radiusBottom;
    cylinder.rotateZ(Math.PI/2);

    objects.push(cylinder);
    return cylinder;
  }

  $('.button').click(function(){
      $('#modal').css('display','block');
      $('.modal-bg').fadeIn().find('input').eq(0).focus();
      doc.trigger('openModal');
  });

  $('#close').click(function(){
      $('.modal-bg').fadeOut();
      $('#modal').fadeOut();
      doc.trigger('closeModal');
    return false;
  });

  $('#opClose').click(function(){
    $('.operationModal-bg').fadeOut();
    $('#operationModal').fadeOut();
    doc.trigger('closeModal');
    return false;
  });

  // $('.close').click(function(){
  //   var self = $(this);
  //   self.parents('.modal').add(self.parents('.cover')).fadeOut();
  // })

  $('#codeClose').click(function(){
    $('.interfaceVisible').fadeOut();
    doc.trigger('closeModal');
    return false;
  });

  $('#latheClose').click(function(){
    $('.interfaceVisible').fadeOut();
    doc.trigger('closeModal');
    return false;
  });

  doc
    .on('openModal', function(e, modal){
      projector = {};
    })
    .on('closeModal', function(e, modal){
      projector = new THREE.Projector();
    })
});
