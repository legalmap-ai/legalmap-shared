<template>
  <div class="pricing" id="pricing">
    <h2 class="pricing__title">
      W<span>A</span>TCH: <br />
      Une offre adaptée à votre activité
    </h2>
    <h3 class="pricing__subtitle">Économisez jusqu’à 25% avec l’offre annuelle</h3>

    <div class="pricing__billplan">
      <span :class="{ active: !annual }" @click="annual = false"> Tarif mensuel </span>
      <q-toggle color="blue" v-model="annual" />
      <span :class="{ active: annual }" @click="annual = true"> Tarif annuel </span>
    </div>

    {{ openDialog }}
    <q-dialog
      v-model="openDialog.open"
      persistent
      transition-show="slide-up"
      transition-hide="slide-down"
    >
      <SubscriptionInformationsForm @submit="handleSubscribe(openDialog.plan)" />
    </q-dialog>

    <div class="cards">
      <div class="card">
        <div class="card__title">Starter</div>
        <div style="flex: 1"></div>
        <div style="flex: 1"></div>

        <div>
          <div class="card__price">
            <span>
              <template v-if="annual">336€</template>
              <template v-else>34.90€</template>
            </span>
            <span style="cursor: pointer" @click="annual = !annual"
              >/
              <template v-if="annual">an</template>
              <template v-else>mois</template>
            </span>
          </div>
          <div class="card__price--detail" v-if="!annual">&nbsp;</div>
          <div class="card__price--detail q-mt-sm" v-else>soit 29€ / mois / utilisateur</div>
        </div>
        <div style="flex: 1"></div>

        <BaseButton
          id="section-pricing-subscribe-starter"
          small
          style="width: 80%"
          @click="handleAskInformations('starter')"
          :size="16"
          >Souscrire</BaseButton
        >
        <ul>
          <li>
            <span>
              <span class="text-blue"><b style="font-weight: 600">20</b></span> surveillances
              activables
            </span>
          </li>
        </ul>
      </div>

      <div class="card">
        <div class="card__title">Formule Équipe</div>
        <q-slider
          style="width: 80%"
          v-model="members"
          :min="2"
          :max="10"
          :step="1"
          track-size="1px"
          thumb-size="20px"
        />

        <div class="card__members">
          <span>{{ members }} utilisateur{{ members > 1 ? 's' : '' }}</span>
        </div>
        <div style="flex: 1"></div>
        <div>
          <div class="card__price" style="position: relative; top: -10px">
            <span>{{ getPrice }}</span>
            <span style="cursor: pointer" @click="annual = !annual"
              >/
              <template v-if="annual">an</template>
              <template v-else>mois</template>
            </span>
          </div>

          <div class="card__price--detail" v-if="!annual">soit 29€ / mois / utilisateur</div>
          <div class="card__price--detail" v-else>soit 26€ / mois / utilisateur</div>
        </div>

        <div style="flex: 1"></div>

        <BaseButton
          id="section-pricing-subscribe-team"
          small
          style="width: 80%"
          to="/demo"
          :size="16"
          disabled
          >Souscrire</BaseButton
        >
        <ul>
          <li>
            <span
              ><span class="text-blue"><b style="font-weight: 600">25</b></span> surveillances
              activables par utilisateur</span
            >
          </li>
        </ul>
      </div>

      <div class="card">
        <div class="card__title">Organisation</div>

        <div style="flex: 1"></div>
        <div style="flex: 1"></div>

        <div class="card__price">Parlons-en</div>

        <div style="flex: 1"></div>

        <BaseButton id="section-pricing-contact-us" small style="width: 80%" to="/demo" :size="16"
          >Contactez-nous</BaseButton
        >
        <p>
          Besoin d’un service sur mesure ? <br />
          Discutons d’une solution adaptée à l’ensemble de vos besoins
        </p>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.pricing {
  max-width: 920px;
  width: 90%;
  margin: auto;
  margin-top: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 100px;

  &__title {
    font-size: 42px;
    line-height: 52px;
    font-weight: 700;
    color: $grey1;
    text-align: center;
    margin: auto;
    margin-bottom: 20px;
    max-width: 800px;
    width: 90%;

    span {
      color: $blue;
    }
  }

  &__subtitle {
    font-size: 20px;
    line-height: 30px;
    color: $grey1;
    text-align: center;
    margin-bottom: 60px;
  }

  &__billplan {
    display: flex;
    gap: 20px;
    align-items: center;
    justify-content: center;
    margin-bottom: 30px;

    span {
      cursor: pointer;
      font-size: 20px;
      line-height: 30px;
      color: #9fa8b0;

      &.active {
        color: $blue;
      }
    }
  }

  .cards {
    display: flex;
    gap: 20px;
    justify-content: center;

    .card {
      background: linear-gradient(130deg, rgba($blue, 0.1), rgba($blue, 0));
      border-radius: 8px;
      border: solid 1px $grey5;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      width: 300px;

      &:nth-child(2) {
        border: solid 4px $blue;
      }

      &__title {
        font-size: 12px;
        line-height: 16px;
        font-weight: 500;
        color: $grey1;
        background-color: #fff;
        border-radius: 100px;
        padding: 0px 10px;
        margin-top: 40px;
      }

      &__price {
        font-size: 35px;
        line-height: 63px;
        font-weight: 300;
        color: $grey1;
        display: flex;
        align-items: flex-end;
        justify-content: center;
        gap: 10px;
        flex: 1;
        height: 90%;

        span:last-child {
          color: $grey4;
          font-size: 16px;
          line-height: 24px;
          font-weight: 500;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 63px;
        }

        @media (max-width: $breakpoint-sm-max) {
          span:last-child {
            height: auto;
          }
        }
      }

      &__price--detail {
        position: relative;
        top: -14px;
        font-size: 14px;
        line-height: 24px;
        color: #6f6f6f;
        font-weight: 500;
        text-align: center;
        border-bottom-left-radius: 8px;
        border-bottom-right-radius: 8px;
      }

      p {
        height: 152px;
        margin-bottom: 0px;
        font-size: 14px;
        line-height: 24px;
        color: $grey1;
        text-align: center;
        padding-top: 40px;
        padding-bottom: 40px;
        padding-left: 30px;
        padding-right: 30px;
        background-color: #fff;
        border-bottom-left-radius: 8px;
        border-bottom-right-radius: 8px;
      }

      &__members {
        font-size: 16px;
        line-height: 0px;
        color: $grey1;
      }

      hr {
        width: 80%;
        border: none;
        border-top: 1px solid $grey5;
      }

      ul {
        height: 152px;
        list-style: none;
        padding: 0;
        margin: 0;
        font-size: 20px;
        line-height: 30px;
        color: $grey1;
        width: 100%;
        padding-bottom: 40px;
        padding: 40px;
        background-color: white;
        padding-left: 30px;
        padding-right: 30px;
        border-bottom-left-radius: 8px;
        border-bottom-right-radius: 8px;

        li {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #9797a5;
          font-size: 16px;
          line-height: 24px;
          width: 100%;

          &:before {
            content: '';
            background-image: url('../assets/check.svg');
            background-size: cover;
            width: 12.5px;
            padding-right: 12.5px;
            height: 11px;
          }
        }
      }
    }

    @media (max-width: $breakpoint-sm-max) {
      flex-direction: column;
      gap: 20px;

      .card {
        width: 100%;
        gap: 10px;

        &__title {
          font-size: 16px;
          line-height: 24px;
        }

        &__price {
          font-size: 24px;
          line-height: 36px;
        }

        ul {
          font-size: 16px;
          line-height: 24px;
          height: 100px;
        }
      }
    }
  }
}
</style>

<script lang="ts" setup>
import { Notify } from 'quasar';
import BaseButton from 'src/components/BaseButton.vue';
import { invokeApi } from 'src/services/ServicesUsers';
import { Ref, computed, ref } from 'vue';
import SubscriptionInformationsForm from './SubscriptionInformationsForm.vue';

const annual = ref(true);
const members = ref(2);
const openDialog = ref({
  plan: '',
  open: false,
}) as Ref<{ plan: string; open: boolean }>;

const getPrice = computed(() => {
  const unitPrice = annual.value ? 312 : 29.0;
  if (annual.value) {
    return `${unitPrice * members.value}€`;
  } else {
    return `${(unitPrice * members.value).toFixed(2)}€`;
  }
});

const handleAskInformations = (plan: string) => {
  openDialog.value = {
    plan: plan,
    open: true,
  };
};

const handleSubscribe = async (plan: string) => {
  console.log(plan);
  let priceId = '';
  if (plan === 'starter') {
    if (annual.value) {
      priceId = 'price_1Q5o7vP4GCw0NcGsZSX1CKwa';
    } else {
      priceId = 'price_1Q5o7vP4GCw0NcGs81mfFdwe';
    }
  } else {
    return Notify.create({
      message: "Cette fonctionnalité n'est pas encore disponible",
      color: 'negative',
    });
  }

  const getPortail = await invokeApi({
    index: 1,
    method: 'POST',
    path: '/subscriptions',
    parameters: {
      priceId,
    },
    useQueryString: false,
    forceRefreshToken: false,
  });

  if (getPortail.session_url) {
    window.location.href = getPortail.session_url;
  } else {
    Notify.create({
      message: "Une erreur s'est produite",
      color: 'negative',
    });
  }
};
</script>
