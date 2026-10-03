// Stub supabaseClient untuk pengujian di Node (tanpa browser & tanpa network).
export const calls = {
  batchSigned: 0,
  singleSigned: 0,
  uploads: 0,
  removes: 0,
  lastUploadPath: null
};

export const supabase = {
  storage: {
    from() {
      return {
        async createSignedUrls(paths, ttl) {
          calls.batchSigned += 1;
          return {
            data: paths.map((p) => ({ path: p, signedUrl: `https://cdn.test/signed/${p}?ttl=${ttl}`, error: null })),
            error: null
          };
        },
        async createSignedUrl(path, ttl) {
          calls.singleSigned += 1;
          return { data: { signedUrl: `https://cdn.test/single/${path}?ttl=${ttl}` }, error: null };
        },
        async upload(path, file, opts) {
          calls.uploads += 1;
          calls.lastUploadPath = path;
          calls.lastUploadOpts = opts;
          calls.lastUploadFileName = file?.name;
          calls.lastUploadType = file?.type;
          return { data: { path }, error: null };
        },
        async remove(paths) {
          calls.removes += 1;
          return { data: paths, error: null };
        }
      };
    }
  }
};

export const uploadImageToStorage = async (fileOrBlob, subfolder = 'units') => {
  const ext = (fileOrBlob?.type || 'image/jpeg').split('/')[1] || 'jpg';
  const path = `${subfolder}/mocked_${Date.now()}.${ext}`;
  calls.uploads += 1;
  calls.lastUploadPath = path;
  return path;
};

export const isSupabaseConfigured = () => true;
export const getSupabaseConfig = () => ({ url: 'https://stub.test', anonKey: 'stub', source: 'test' });
