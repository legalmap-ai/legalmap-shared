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
    <q-card-section>
      <div class="q-mb-sm">
        <q-btn size="md" color="primary" unelevated @click="loadPdf">Charger le pdf</q-btn>
      </div>
      <q-input
        v-model="keywords"
        type="text"
        label="Mots clés"
        outlined
        dense
        class="text-h10"
        style="width: 300px"
      ></q-input>
    </q-card-section>
    <q-card-section>
      <div class="q-mb-sm">
        <div>
          <div v-for="(detail, phrase) in pdfSearchDetails" :key="phrase">
            <q-checkbox
              v-model="detail['filter']"
              @update:model-value="updateFilters(phrase, detail.pages, $event)"
              >Filtrer</q-checkbox
            >
            Pages pour la recherche {{ phrase }} :
            <span v-for="page in detail.pages" :key="page" class="page-item"> - {{ page }} </span>
          </div>
        </div>
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
      {{ pdfMatchUniquePagesNumber.length }}
      <div class="pdf-thumbnails-container" v-if="pdfMatchUniquePagesNumber.length == 0">
        <div class="thumbnail" v-for="page in pdfData.pages" :key="page">
          <div class="text-center">
            <h3>{{ page }}</h3>
            <VuePDF
              :pdf="pdfData.pdf"
              :page="page"
              style="width: 100%; border: 1px solid #cccccc"
            />
          </div>
        </div>
      </div>
      <div v-else>
        <div class="thumbnail" v-for="pageIndex in pdfMatchUniquePagesNumber" :key="pageIndex">
          <div class="text-center">
            <h3>{{ pageIndex }}</h3>
            <VuePDF
              :pdf="pdfData.pdf"
              :page="pageIndex"
              style="width: 100%; border: 1px solid #cccccc"
            />
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, watch, ShallowRef } from 'vue';
import { VuePDF, usePDF } from '@tato30/vue-pdf';
import { invokeApi } from '../services/ServicesUsers';
import { QueryError } from '../utils/api.utils';
import { translateError } from '../utils/errors.utils';

export interface SearchDetails {
  [key: string]: {
    pages: number[]; // ou string[] si les pages sont représentées par des chaînes
    filter: boolean;
  };
}
export interface PdfDataQuery {
  type: string;
  datas: string;
  details: SearchDetails;
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
    const keywords = ref('');
    const pdfData = ref<PdfDatas>({});
    const pdfUrl = ref('');
    const pdfPage = ref(1);
    const pdfMatchPages = ref([]);
    const pdfMatchUniquePagesNumber = ref<number[]>([]);
    const pdfSearchDetails = ref<SearchDetails>({});

    const updatePdf = (value: string) => {
      const { pdf, pages, info } = usePDF(value);
      pdfData.value = {
        pdf,
        pages,
        info,
      };
    };
    watch(
      () => pdfUrl.value,
      (newValue) => {
        updatePdf(newValue);
      }
    );

    const pdfBlobUrl = ref<string | null>(null);
    const api_error = ref<string | null>(null);
    const api_response = ref<PdfDataQuery | null>(null);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateFilters = (phrase: string | number, pages: number[], value: boolean) => {
      if (value === true) {
        pages.forEach((page) => {
          const entry: never = `${phrase}-${page}` as never;
          // Ajout si l'entrée n'existe pas déjà
          if (!pdfMatchPages.value.includes(entry)) {
            pdfMatchPages.value.push(entry);
          }
        });
      } else {
        pages.forEach((page) => {
          const entry = `${phrase}-${page}`;
          // Suppression de l'entrée si elle existe
          const index = pdfMatchPages.value.indexOf(entry as never);
          if (index > -1) {
            pdfMatchPages.value.splice(index, 1);
          }
        });
      }
      pdfMatchUniquePagesNumber.value = [];
      pdfMatchPages.value.forEach((pageElement: string) => {
        const pageIndex: number = parseInt(pageElement.split('-')[1]);
        if (pdfMatchUniquePagesNumber.value.includes(pageIndex as never) === false) {
          pdfMatchUniquePagesNumber.value.push(pageIndex);
        }
      });

      updatePdf(pdfUrl.value);
    };

    const loadPdf = async () => {
      try {
        api_error.value = null; // Reset error before fetch
        console.log('sended query');

        let highlightArray;
        if (keywords.value == '') {
          highlightArray = [''];
        } else {
          highlightArray = keywords.value
            .split(',')
            .map((word) => word.trim())
            .filter(Boolean);
        }
        api_response.value = (await invokeApi({
          index: 0,
          method: 'GET',
          path: '/pdfs/62fd6126138a209d5e24a13f',
          parameters: {
            highlight: highlightArray,
            pages: 'all',
            action: 'read',
          },
          useQueryString: true,
          forceRefreshToken: false,
        })) as PdfDataQuery;
        console.log('received results');
        const pdf_data = api_response.value.datas;
        pdfSearchDetails.value = api_response.value.details;

        Object.entries(pdfSearchDetails.value).forEach(([key, detail]) => {
          console.log('initialize filter for ' + key);
          detail.filter = false;
        });

        // Convertir le PDF encodé en base64 en Blob
        const byteCharacters = atob(pdf_data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const pdfBlob = new Blob([byteArray], { type: 'application/pdf' });

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

    onMounted(() => {});

    return {
      loadPdf,
      updateFilters,
      api_response,
      api_error,
      keywords,
      pdfSearchDetails,
      pdfMatchUniquePagesNumber,
      pdfMatchPages,
      pdfPage,
      pdfData,
      pdfUrl,
      // pdf,
    };
  },
});
</script>

<style scoped>
.pdf-thumbnails-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center; /* Centre les éléments horizontalement */
  align-items: center; /* Centre les éléments verticalement, si nécessaire */
  width: 100%;
  overflow: hidden;
}

.thumbnail {
  margin: 10px; /* Optionnel: ajoute un peu de marge autour des miniatures */
  display: flex;
  justify-content: center; /* Centre le contenu à l'intérieur de chaque miniature si nécessaire */
  align-items: center;
}
</style>

<!--
@media (max-width: 1024px) {
  .thumbnail {
    flex: 1 1 calc(33.333% - 32px); /* 3 miniatures par ligne */
  }
}

@media (max-width: 768px) {
  .thumbnail {
    flex: 1 1 calc(50% - 32px); /* 2 miniatures par ligne */
  }
}

@media (max-width: 480px) {
  .thumbnail {
    flex: 1 1 calc(100% - 32px); /* 1 miniature par ligne */
  }
} -->
