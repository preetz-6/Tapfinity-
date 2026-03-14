// Web NFC API type declarations
// https://w3c.github.io/web-nfc/

declare global {
  interface NDEFRecord {
    recordType: string;
    mediaType?: string;
    id?: string;
    data?: DataView;
    encoding?: string;
    lang?: string;
  }

  interface NDEFMessage {
    records: NDEFRecord[];
  }

  interface NDEFReadingEvent extends Event {
    serialNumber: string;
    message: NDEFMessage;
  }

  interface NDEFWriteRecord {
    recordType: string;
    mediaType?: string;
    id?: string;
    data?: BufferSource | string;
  }

  interface NDEFWriteMessage {
    records: NDEFWriteRecord[];
  }

  interface NDEFWriteOptions {
    overwrite?: boolean;
    signal?: AbortSignal;
  }

  interface NDEFReader extends EventTarget {
    onreading: ((event: NDEFReadingEvent) => void) | null;
    onreadingerror: ((event: Event) => void) | null;
    scan(options?: { signal?: AbortSignal }): Promise<void>;
    write(message: NDEFWriteMessage, options?: NDEFWriteOptions): Promise<void>;
    abort(): Promise<void>;
  }

  interface Window {
    NDEFReader: {
      new(): NDEFReader;
    };
  }
}

export {};
