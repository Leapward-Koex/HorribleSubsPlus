class LoadBar {
    loadBarContainer: HTMLDivElement;
    loadBarElement: HTMLDivElement;
    loadBar: any;
    id: any;
    constructor(id?){
        this.id = id;
        this.loadBarContainer = document.createElement('div');
        this.loadBarElement = document.createElement('div');
        this.loadBarElement.classList.add('ldbar');
        this.loadBarContainer.classList.add('loadBarContainer', 'well');
        this.loadBarElement.id = `loadBarId${(id ? id : uuidv4())}`; // Append id if supplied, otherwise use GUID
        this.loadBarContainer.appendChild(this.loadBarElement);
        
        document.querySelector("body").appendChild(this.loadBarContainer);

        // @ts-ignore
        this.loadBar = new ProgressBar.Line("#" + this.id, {
            strokeWidth: 2,
            easing: 'easeInOut',
            duration: 1400,
            color: '#FFEA82',
            trailColor: '#DA4453',
            trailWidth: 0.1,
            svgStyle: {width: '100%', height: '100%'},
            from: {color: '#FFEA82'},
            to: {color: '#ED6A5A'},
            step: (state, bar) => {
                bar.path.setAttribute('stroke', state.color);
            },
            text: {
                value: 'Building cache...',
                style: {
                    // Text color.
                    // Default: same as stroke color (options.color)
                    color: '#DA4453',
                    position: 'absolute',
                    left: '50%',
                    top: '-110%',
                    padding: 0,
                    margin: 0,
                    // You can specify styles which will be browser prefixed
                    transform: {
                        prefix: true,
                        value: 'translate(-50%, -50%)'
                    }
                },
                autoStyleContainer: true,
            },
            warnings: true
        });
    }

    animate(percent){
        this.loadBar.animate(percent);
    }

    setText(text){
        this.loadBar.setText(text);
    }

    destroy(){
        this.loadBar.destroy();
        this.loadBarContainer.remove();
    }
    
}

function uuidv4() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    )
  }