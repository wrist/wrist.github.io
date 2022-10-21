"use strict";
(self["webpackChunk_wrist_jupyterlab_wav"] = self["webpackChunk_wrist_jupyterlab_wav"] || []).push([["lib_index_js"],{

/***/ "./lib/AudioComponent.js":
/*!*******************************!*\
  !*** ./lib/AudioComponent.js ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "webpack/sharing/consume/default/react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var wavesurfer_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! wavesurfer.js */ "webpack/sharing/consume/default/wavesurfer.js/wavesurfer.js");
/* harmony import */ var wavesurfer_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(wavesurfer_js__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var wavesurfer_js_dist_plugin_wavesurfer_timeline_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! wavesurfer.js/dist/plugin/wavesurfer.timeline.js */ "./node_modules/wavesurfer.js/dist/plugin/wavesurfer.timeline.js");
/* harmony import */ var wavesurfer_js_dist_plugin_wavesurfer_timeline_js__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(wavesurfer_js_dist_plugin_wavesurfer_timeline_js__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var wavesurfer_js_dist_plugin_wavesurfer_spectrogram_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! wavesurfer.js/dist/plugin/wavesurfer.spectrogram.js */ "./node_modules/wavesurfer.js/dist/plugin/wavesurfer.spectrogram.js");
/* harmony import */ var wavesurfer_js_dist_plugin_wavesurfer_spectrogram_js__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(wavesurfer_js_dist_plugin_wavesurfer_spectrogram_js__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var colormap__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! colormap */ "webpack/sharing/consume/default/colormap/colormap");
/* harmony import */ var colormap__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(colormap__WEBPACK_IMPORTED_MODULE_4__);





/**
 * @returns The React component
 */
const AudioComponent = (props) => {
    const zoomRange = { min: 1, max: 30000, initial: 1 };
    const fftSamplesArray = [...Array(18)].map((_, i) => Math.pow(2, i));
    const fftWindows = [
        'bartlett', 'bartlettHann', 'blackman', 'cosine',
        'gauss', 'hamming', 'hann', 'lanczoz', 'rectangular', 'triangular'
    ];
    const [isPlaying, setPlaying] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
    const [zoom, setZoom] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(zoomRange.initial);
    //const [fftSamples, setFftSamples] = useState(fftSamplesArray[8]);
    const fftSamples = fftSamplesArray[8];
    const fftWindow = fftWindows[6];
    // const [keypress, setKeyPress] = useState(false);
    const wavesurferRef = (0,react__WEBPACK_IMPORTED_MODULE_0__.useRef)();
    const waveContainerRef = (0,react__WEBPACK_IMPORTED_MODULE_0__.useRef)(null);
    const spectrogramContainerRef = (0,react__WEBPACK_IMPORTED_MODULE_0__.useRef)(null);
    const timelineContainerRef = (0,react__WEBPACK_IMPORTED_MODULE_0__.useRef)(null);
    const waveColor = '#4BF2A7';
    const bgColor = 'black';
    const colors = colormap__WEBPACK_IMPORTED_MODULE_4___default()({
        colormap: 'plasma',
        nshades: 256,
        format: 'float'
    });
    // construct wavesurfer
    (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
        if (!wavesurferRef.current &&
            waveContainerRef.current !== null &&
            spectrogramContainerRef.current !== null &&
            timelineContainerRef.current !== null) {
            console.log('WaveSurfer.create called');
            wavesurferRef.current = wavesurfer_js__WEBPACK_IMPORTED_MODULE_1___default().create({
                container: waveContainerRef.current,
                waveColor: waveColor,
                backgroundColor: bgColor,
                splitChannels: true,
                plugins: [
                    wavesurfer_js_dist_plugin_wavesurfer_timeline_js__WEBPACK_IMPORTED_MODULE_2___default().create({
                        container: timelineContainerRef.current
                    }),
                    wavesurfer_js_dist_plugin_wavesurfer_spectrogram_js__WEBPACK_IMPORTED_MODULE_3___default().create({
                        wavesurfer: wavesurferRef.current,
                        container: spectrogramContainerRef.current,
                        labels: true,
                        colorMap: colors,
                        fftSamples: fftSamples,
                        windowFunc: fftWindow,
                        splitChannels: true
                    })
                ]
            });
        }
        // return () => {
        //   const wavesurfer = wavesurferRef.current;
        //   console.log("WaveSurfer unmounted");
        //   if (wavesurfer){
        //     if(wavesurfer.isPlaying()) { wavesurfer.pause(); }
        //     // wavesurfer.destroy();
        //   }
        // };
    }, [
        wavesurferRef,
        waveContainerRef,
        spectrogramContainerRef,
        timelineContainerRef,
        colors,
        fftSamples
    ]);
    // load a wave file
    (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
        const wavesurfer = wavesurferRef.current;
        if (wavesurfer && props.src) {
            console.log('wavesurfer.load called');
            wavesurfer.load(props.src);
        }
    }, [wavesurferRef, props.src]);
    // play/pause based on the state
    (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
        const wavesurfer = wavesurferRef.current;
        if (wavesurfer) {
            if (isPlaying) {
                wavesurfer.play();
            }
            else {
                wavesurfer.pause();
            }
        }
    }, [wavesurferRef, isPlaying]);
    // control zoom
    (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
        const wavesurfer = wavesurferRef.current;
        if (wavesurfer) {
            wavesurfer.zoom(/*pxPerSec=*/ zoom);
            wavesurfer.spectrogram.init();
        }
    }, [wavesurferRef, zoom]);
    /*
    // space key handling
    const downHandler = e => {
      if (e.key === ' ') {
        setKeyPress(true);
      }
    };
    const upHandler = e => {
      if (e.key === ' ') {
        setKeyPress(false);
      }
    };
  
    useEffect(() => {
      // register
      window.addEventListener('keydown', downHandler);
      window.addEventListener('keyup', upHandler);
  
      // cleanup
      return () => {
        window.removeEventListener('keydown', downHandler);
        window.removeEventListener('keyup', upHandler);
      };
    }, []);
  
    // toggle isPlaying for every keyPress
    useEffect(() => {
      const wavesurfer = wavesurferRef.current;
      if (wavesurfer) {
        if (keypress) {
          setPlaying(!isPlaying);
        }
      }
    }, [wavesurferRef, keypress]);
    */
    return (react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { style: { width: '100%' } },
        react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { id: "timeline", ref: timelineContainerRef }),
        react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { id: "waveform", ref: waveContainerRef }),
        react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { id: "spectrogram", ref: spectrogramContainerRef }),
        react__WEBPACK_IMPORTED_MODULE_0___default().createElement("button", { onClick: () => {
                isPlaying ? setPlaying(false) : setPlaying(true);
            } },
            ' ',
            "Play/Pause",
            ' '),
        react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", null,
            " ",
            isPlaying ? 'Playing' : 'Pause',
            " "),
        react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { id: "zoom" },
            react__WEBPACK_IMPORTED_MODULE_0___default().createElement("input", { type: "range", value: zoom, onChange: e => setZoom(Number(e.target.value)), min: zoomRange.min, max: zoomRange.max, style: { width: '100%' } }),
            "zoom: ",
            zoom,
            " [pixel/sec]")));
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (AudioComponent);
//# sourceMappingURL=AudioComponent.js.map

/***/ }),

/***/ "./lib/index.js":
/*!**********************!*\
  !*** ./lib/index.js ***!
  \**********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__),
/* harmony export */   "rendererFactory": () => (/* binding */ rendererFactory)
/* harmony export */ });
/* harmony import */ var _widget__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./widget */ "./lib/widget.js");

/**
 * The default mime type for the extension.
 */
const MIME_TYPES = ['audio/wav', 'audio/mp3', 'audio/flac'];
/**
 * A mime renderer factory for wav data.
 */
const rendererFactory = {
    safe: true,
    mimeTypes: MIME_TYPES,
    createRenderer: options => new _widget__WEBPACK_IMPORTED_MODULE_0__.WavWidget(options)
};
/**
 * Extension definition.
 */
const extension = {
    id: 'jupyterlab-wav:plugin',
    rendererFactory,
    rank: 0,
    dataType: 'string',
    fileTypes: [
        {
            name: 'wav',
            fileFormat: 'base64',
            mimeTypes: [MIME_TYPES[0]],
            extensions: ['.wav']
        },
        {
            name: 'mp3',
            fileFormat: 'base64',
            mimeTypes: [MIME_TYPES[1]],
            extensions: ['.mp3']
        },
        {
            name: 'flac',
            fileFormat: 'base64',
            mimeTypes: [MIME_TYPES[2]],
            extensions: ['.flac']
        }
    ],
    documentWidgetFactoryOptions: {
        name: 'JupyterLab wav viewer',
        primaryFileType: 'wav',
        modelName: 'base64',
        fileTypes: ['wav', 'mp3', 'flac'],
        defaultFor: ['wav', 'mp3', 'flac']
    }
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (extension);
//# sourceMappingURL=index.js.map

/***/ }),

/***/ "./lib/widget.js":
/*!***********************!*\
  !*** ./lib/widget.js ***!
  \***********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "WavWidget": () => (/* binding */ WavWidget)
/* harmony export */ });
/* harmony import */ var _jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @jupyterlab/apputils */ "webpack/sharing/consume/default/@jupyterlab/apputils");
/* harmony import */ var _jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ "webpack/sharing/consume/default/react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _AudioComponent__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./AudioComponent */ "./lib/AudioComponent.js");



/**
 * The class name added to the extension.
 */
const CLASS_NAME = 'mimerenderer-wav';
/**
 * A widget for rendering wav.
 */
class WavWidget extends _jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_0__.ReactWidget {
    constructor(options) {
        super();
        this._mimeType = options.mimeType;
        this._src = '';
        this.addClass(CLASS_NAME);
        console.log('WavWidget created');
        console.log(`options.mimeType: ${this._mimeType}`);
    }
    renderModel(model) {
        console.log('WavWidget renderModel called');
        const data = model.data[this._mimeType];
        this._src = `data:${this._mimeType};base64,${data}`;
        this.update();
        return Promise.resolve();
    }
    render() {
        console.log('WavWidget render called');
        return react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_AudioComponent__WEBPACK_IMPORTED_MODULE_2__["default"], { src: this._src });
    }
}
//# sourceMappingURL=widget.js.map

/***/ })

}]);
//# sourceMappingURL=lib_index_js.bbfecac10a37e1481591.js.map