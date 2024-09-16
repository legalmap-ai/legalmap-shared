<template>
  <q-page>
    <q-card-section v-if="api_error" class="text-negative">
      Erreur: {{ api_error }}
    </q-card-section>

    <q-card-section v-if="api_response">
      <div class="q-mb-sm">
        {{ api_response }}
      </div>
    </q-card-section>

    <div class="q-pt-sm text-center">
      <div>
        <q-btn
          outline
          size="sm"
          color="primary"
          unelevated
          text-color="primary"
          @click="pdfPage = pdfPage > 1 ? pdfPage - 1 : pdfPage"
        >
          Prev
        </q-btn>
        <span class="text-h10 daxte-text-dx-blue-grey-1-h2"
          >&nbsp;{{ pdfPage }} / {{ pdfData.pages }}&nbsp;</span
        >
        <q-btn
          outline
          size="sm"
          color="primary"
          unelevated
          text-color="primary"
          @click="pdfPage = pdfPage < pdfData.pages ? pdfPage + 1 : pdfPage"
        >
          Next
        </q-btn>
      </div>
      <div class="text-center q-pt-sm">
        <VuePDF :pdf="pdfData.pdf" :page="pdfPage" />
      </div>
    </div>
  </q-page>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, watch, ShallowRef } from 'vue';
import { VuePDF, usePDF } from '@tato30/vue-pdf'; //PDFInfo
import { invokeApi } from '../services/ServicesUsers';
import { QueryError } from '../utils/api.utils';
import { translateError } from '../utils/errors.utils';

export interface PdfDataQuery {
  type: string;
  datas: string;
}

export interface PdfDatas {
  pdf?: ShallowRef;
  pdfDoc?: ShallowRef | null;
  pages?: ShallowRef;
  info?: ShallowRef;
}

export default defineComponent({
  components: {
    VuePDF, // Déclare le composant vue-pdf
  },
  setup() {
    const isPdfVisible = ref(false);
    const pdfData = ref<PdfDatas>({});
    const pdfUrl = ref('');
    const pdfPage = ref(1);
    const { pdf } = usePDF({
      url: pdfUrl.value,
    });

    watch(
      () => pdfUrl.value,
      (newValue) => {
        const { pdf, pages, info } = usePDF(newValue);
        pdfData.value = {
          pdf,
          pages,
          info,
        };
      }
    );

    const pdfBlobUrl = ref<string | null>(null);
    const api_error = ref<string | null>(null);
    const api_response = ref<PdfDataQuery | null>(null);

    const loadPdf = async () => {
      try {
        api_error.value = null; // Reset error before fetch
        console.log('sended query');
        api_response.value = (await invokeApi({
          index: 0,
          method: 'GET',
          path: '/pdfs/62fd6126138a209d5e24a13f', //62fd6126138a209d5e24a13f
          parameters: {
            highlight: ['arnaud de la bédoyère', 'daxte', 'g3cb', 'société'], //null or ['phrase 1', 'phrase 2']
            pages: 'all', //ALL or [1,2,3,4]
            action: 'read', //read or download
          },
          //parameters: '',
          useQueryString: true,
          forceRefreshToken: false,
        })) as PdfDataQuery;
        console.log('received results');
        const pdf_data = api_response.value.datas;

        // Convertir le PDF encodé en base64 en Blob
        const byteCharacters = atob(pdf_data); // Décodage du base64
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const pdfBlob = new Blob([byteArray], { type: 'application/pdf' });

        // Créer un URL Blob à utiliser dans vue-pdf
        pdfBlobUrl.value = URL.createObjectURL(pdfBlob);
        pdfUrl.value = pdfBlobUrl.value;

        console.log(pdfUrl.value);
      } catch (error) {
        const translated_error = translateError(error as QueryError);
        console.log(translated_error);
        const errorDetails =
          (error as QueryError).response?.data || (error as QueryError).message || error;
        api_error.value =
          'API call failed: ' +
          (typeof errorDetails === 'object' ? JSON.stringify(errorDetails, null, 2) : errorDetails);
      }
    };

    onMounted(() => {
      loadPdf();
    });

    return {
      api_response,
      api_error,
      isPdfVisible,
      pdfPage,
      pdfData,
      pdfUrl,
      pdf,
    };
  },
});
</script>
