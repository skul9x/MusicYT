export namespace main {
	
	export class DependencyStatus {
	    ok: boolean;
	    message: string;
	    os: string;
	    ytdlp_ok: boolean;
	    ffmpeg_ok: boolean;
	
	    static createFrom(source: any = {}) {
	        return new DependencyStatus(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ok = source["ok"];
	        this.message = source["message"];
	        this.os = source["os"];
	        this.ytdlp_ok = source["ytdlp_ok"];
	        this.ffmpeg_ok = source["ffmpeg_ok"];
	    }
	}

}

