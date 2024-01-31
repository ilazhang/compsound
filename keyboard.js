document.addEventListener("DOMContentLoaded", function(event) {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const keyboardFrequencyMap = {
      '90': 261.63,  //Z - C
      '83': 277.18, //S - C#
      '88': 293.66,  //X - D
      '68': 311.13, //D - D#
      '67': 329.63,  //C - E
      '86': 349.23,  //V - F
      '71': 369.99, //G - F#
      '66': 392.00,  //B - G
      '72': 415.30, //H - G#
      '78': 440.00,  //N - A
      '74': 466.16, //J - A#
      '77': 493.88,  //M - B
      //next octave, goes to next line on keyboard
      '81': 523.25,  //Q - C
      '50': 554.37, //2 - C#
      '87': 587.33,  //W - D
      '51': 622.25, //3 - D#
      '69': 659.25,  //E - E
      '82': 698.46,  //R - F
      '53': 739.99, //5 - F#
      '84': 783.99,  //T - G
      '54': 830.61, //6 - G#
      '89': 880.00,  //Y - A
      '55': 932.33, //7 - A#
      '85': 987.77,  //U - B
  };

  const waveformChoice = document.getElementById('waveformChoice');
  const harmonizationChoice = document.getElementById('harmonizationChoice');

  const globalGain = audioCtx.createGain(); //this will control the volume of all notes
  globalGain.gain.value = 0.8;
  globalGain.connect(audioCtx.destination);

  window.addEventListener('keydown', keyDown, false);
  window.addEventListener('keyup', keyUp, false);

  activeOscillators = {};

  function keyDown(event) {
      const key = (event.detail || event.which).toString();
      if (keyboardFrequencyMap[key] && !activeOscillators[key]) {
          playNote(key);
          if (harmonizationChoice.value !== 'none') {
              harmonize(keyboardFrequencyMap[key], harmonizationChoice.value, 0.75);
          }
      }
  }
  

  function keyUp(event) {
      const key = (event.detail || event.which).toString();
      if (keyboardFrequencyMap[key] && activeOscillators[key]) {
          activeOscillators[key].stop();
          delete activeOscillators[key];
      }
  }
  
  

  function playNote(key) {
      const gainNode = audioCtx.createGain();
      gainNode.gain.value = 1 / (Object.keys(activeOscillators).length + 1);
      //osc.connect(gainNode).connect.(globalGain); //you will need a new gain node for each node to control the adsr of that note
      //osc.connect(gainNode);
      gainNode.connect(globalGain);

      const osc = audioCtx.createOscillator();
      osc.frequency.setValueAtTime(keyboardFrequencyMap[key], audioCtx.currentTime);
      osc.type = waveformChoice.value;

      osc.connect(gainNode);
      osc.start();
      activeOscillators[key] = osc;
  }

  function harmonize(frequency, harmonizationChoice, duration){
      //this is my best attempt at using what I remember from frequency ratios in music theory, and a lot of combing through reddit
      //for how to correctly use those here, I hope they are correct!!
      const ratios={'fifth': 7/12,
          'octave': 12/12,
          'all': [7/12, 12/12]
      };
  
      const intervals = Array.isArray(ratios[harmonizationChoice])?ratios[harmonizationChoice]:[ratios[harmonizationChoice]];
  
      intervals.forEach(interval=>{
          const harFrequency = frequency*Math.pow(2, interval);
          const gainNode = audioCtx.createGain();
          gainNode.connect(globalGain);
  
          const harOsc = audioCtx.createOscillator();
          harOsc.frequency.setValueAtTime(harFrequency, audioCtx.currentTime);
          harOsc.type = waveformChoice.value;
          harOsc.connect(gainNode);
  
          // Schedule the stop and adjust gain value for tapering
          const currentTime = audioCtx.currentTime;
          gainNode.gain.setValueAtTime(2.0, currentTime);
          gainNode.gain.linearRampToValueAtTime(0.0, currentTime + duration);
  
          harOsc.start();
          harOsc.stop(currentTime + duration);
      });
  }
  
  
});