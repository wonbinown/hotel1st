<!-- path: src/views/reservation/ReservationReadyPage.vue -->
<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getFeaturedHotel, createReservationHold } from '@/api/reservation'

const router = useRouter()
const showAdvanced = ref(false)
// 화면 상태
const loading   = ref(true)
const creating  = ref(false)  // ← 홀드 생성 중(이중 클릭 방지)
const hotel     = ref(null)   // { id, name, region, roomTypes:[{id,name,price,todayRemaining}] }
const error     = ref(null)
const raw       = ref(null)   // 원본 응답(디버그)

// 입력값
const checkIn    = ref('')
const checkOut   = ref('')
const guestName  = ref('홍길동')
const phone      = ref('01012345678')

// ★ 백엔드 @Valid 필수 값 (폼에서 입력받아 전송)
const userId     = ref(1)
const ratePlanId = ref(1)
const guests     = ref(1)

// 백엔드 반환 포맷이 달라도 렌더되도록 정규화
function normalizeFeatured(payload) {
  const obj = Array.isArray(payload) ? (payload[0] ?? null) : payload
  if (!obj) return null
  const id       = obj.id ?? obj.hotelId ?? null
  const name     = obj.name ?? obj.hotelName ?? ''
  const region   = obj.region ?? '-'
  const roomList = Array.isArray(obj.roomTypes)
    ? obj.roomTypes
    : (obj.roomType ? [obj.roomType] : [])
  const rtFixed = roomList.map(rt => ({
    id: rt.id,
    name: rt.name ?? '-',
    price: Number(rt.price ?? 0),
    todayRemaining: Number(rt.todayRemaining ?? 0)
  }))
  return { id, name, region, roomTypes: rtFixed }
}

onMounted(async () => {
  loading.value = true
  try {
    const { data } = await getFeaturedHotel()
    raw.value = data
    const n = normalizeFeatured(data)
    if (!n || !n.roomTypes?.length) {
      throw new Error('표시할 룸타입이 없습니다.')
    }
    hotel.value = n
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || '호텔 정보를 불러오지 못했습니다.'
    console.error(e)
  } finally {
    loading.value = false
  }
})

// ✅ 홀드 생성 후 예약 페이지로 이동
async function goReservationPage (roomType) {
  if (!hotel.value) return

  // 1) 기본 유효성 체크
  if (!checkIn.value || !checkOut.value) {
    alert('체크인/체크아웃 날짜를 선택하세요.')
    return
  }
  if (new Date(checkOut.value) <= new Date(checkIn.value)) {
    alert('체크아웃은 체크인보다 뒤여야 합니다.')
    return
  }
  if (!userId.value || !ratePlanId.value) {
    alert('userId / ratePlanId를 확인하세요. (DB에 실제로 존재해야 합니다)')
    return
  }

  // 진행 중이면 중복요청 금지
  if (creating.value) return

  // 2) 수량/정수 보정
  const safeGuests   = Math.max(1, Number(guests.value) || 1)
  const safeUserId   = Number(userId.value)
  const safeRatePlan = Number(ratePlanId.value)

  // 3) payload 구성 (폼 값 사용)
  const payload = {
    hotelId:    hotel.value.id,
    roomTypeId: roomType.id,
    ratePlanId: safeRatePlan,
    userId:     safeUserId,
    guests:     safeGuests,
    checkIn:    checkIn.value,   // yyyy-MM-dd (input[type=date])
    checkOut:   checkOut.value,  // yyyy-MM-dd
    guestName:  guestName.value || undefined,
    phone:      phone.value || undefined,
  }

  try {
    creating.value = true
    const { data } = await createReservationHold(payload)

    // 4) 다음 화면으로 이동 (hold 정보 전달)
    router.push({
      path: '/reservation',
      query: {
        ...payload,
        // ⬇️ 백엔드 응답(카운트다운/요약용)
        holdCode:      data?.holdCode || '',
        holdExpiresAt: data?.expiresAt || '',
        totalAmount:   data?.totalAmount ?? ''   // ← 결제 총액 전달(요약 표시용)
      }
    })
  } catch (e) {
    console.error(e)
    alert(e?.response?.data?.message ?? '예약 홀드 생성에 실패했습니다.')
  } finally {
    creating.value = false
  }
}
</script>

<template>
  <main class="p-6 max-w-3xl mx-auto space-y-4 text-black">
    <h1 class="text-xl font-bold">예약 준비</h1>

    <p v-if="loading">불러오는 중…</p>

    <div v-else-if="error" class="p-3 rounded border border-red-300 bg-red-50 text-red-700">
      <div class="font-semibold">에러: {{ error }}</div>
      <details class="mt-2"><summary class="cursor-pointer">원본 응답 보기</summary>
        <pre class="text-xs whitespace-pre-wrap">{{ JSON.stringify(raw, null, 2) }}</pre>
      </details>
    </div>

    <section v-else-if="hotel" class="p-4 rounded border bg-white text-gray-800">
  <div class="text-lg font-semibold">{{ hotel.name }}</div>
  <div class="text-sm text-gray-500">{{ hotel.region }}</div>

  <!-- 🔁 여기부터 교체 -->
  <div class="room-list">
    <div
      v-for="rt in hotel.roomTypes"
      :key="rt.id"
      class="room-row"
    >
      <img
        class="thumb"
        :src="rt.photo || 'https://images.unsplash.com/photo-1560448075-bb4caa6c7e33?q=80&w=600&auto=format&fit=crop'"
        alt=""
      />

      <div class="meta">
        <div class="name">{{ rt.name }}</div>
        <div class="sub">오늘 잔여 <b>{{ rt.todayRemaining }}</b> • 기본 2인</div>
      </div>

      <div class="price">
        ₩{{ rt.price.toLocaleString() }} <span class="unit">/night</span>
      </div>

      <button
        class="btn mint"
        :disabled="!checkIn || !checkOut || !userId || !ratePlanId || loading || creating"
        @click="goReservationPage(rt)"
      >
        <span v-if="!creating">Book now</span>
        <span v-else>선점 생성 중…</span>
      </button>
    </div>
  </div>
  <!-- 🔁 여기까지 교체 -->
</section>


    <p v-else>표시할 데이터가 없습니다.</p>

    <!-- 날짜/기본 정보 + 유효성 필수 필드 -->
    <section class="space-y-2">
      <div>
        <label>체크인</label>
        <input type="date" v-model="checkIn" class="ml-2 border rounded px-2" />
      </div>
      <div>
        <label>체크아웃</label>
        <input type="date" v-model="checkOut" class="ml-2 border rounded px-2" />
      </div>
      <div class="space-x-2">
        <input placeholder="대표 이름" v-model="guestName" class="px-2 py-1 rounded border" />
        <input placeholder="전화번호" v-model="phone" class="px-2 py-1 rounded border" />
      </div>

      <button class="text-xs text-gray-500 underline" @click="showAdvanced = !showAdvanced">
  고급 설정 {{ showAdvanced ? '숨기기' : '보기' }}
</button>

<!-- 날짜/기본 정보 입력 바로 아래에 추가 -->
<button
  class="mt-3 text-xs text-blue-600 underline decoration-dotted"
  @click="showAdvanced = !showAdvanced"
>
  고급(개발자) 설정 {{ showAdvanced ? '숨기기' : '보기' }}
</button>

<!-- 안내 문구 -->
<div class="mt-2 text-xs leading-5 text-blue-800 bg-blue-50 border border-blue-200 rounded px-3 py-2">
  <strong class="font-semibold">개발자 옵션</strong><br>
  아래 값은 디버깅용 임시 필드입니다. 운영 환경에서는 화면에 노출되지 않고
  로그인/요금제/인원 선택으로 자동 채워집니다.
</div>

<!-- 개발자용 필드(토글) -->
<div v-if="showAdvanced" class="mt-2 grid grid-cols-3 gap-2">
  <label class="text-xs text-gray-600">
    Guests
    <input type="number" min="1" v-model.number="guests"
           class="block w-full mt-1 px-2 py-1 rounded border" placeholder="guests(>=1)" />
  </label>
  <label class="text-xs text-gray-600">
    User ID
    <input type="number" min="1" v-model.number="userId"
           class="block w-full mt-1 px-2 py-1 rounded border" placeholder="userId" />
  </label>
  <label class="text-xs text-gray-600">
    Rate Plan ID
    <input type="number" min="1" v-model.number="ratePlanId"
           class="block w-full mt-1 px-2 py-1 rounded border" placeholder="ratePlanId" />
  </label>
</div>


    </section>
  </main>
</template>
<style scoped>
/* 팔레트 */
:root{
  --mint:#79e0c2;     /* 버튼 상단 */
  --mint-2:#59caa6;   /* 버튼 하단/hover */
  --ink:#0f172a;      /* 진한 글자 */
  --muted:#6b7280;    /* 보조 텍스트 */
  --line:#e5e7eb;     /* 얇은 구분선 */
}

/* 리스트 컨테이너 */
.room-list{
  margin-top: 10px;
  border-top: 1px solid var(--line);
}

/* 한 줄(썸네일/텍스트/가격/버튼) */
.room-row{
  display: grid;
  grid-template-columns: 56px 1fr auto 120px;
  align-items: center;
  gap: 12px;
  padding: 12px 6px;
  border-bottom: 1px solid var(--line);
  background: #fff;
  transition: background-color .15s ease, box-shadow .15s ease, transform .15s ease;
}
.room-row:hover{
  background: #f7fffb; /* 아주 연한 민트 배경 */
}

/* 썸네일 */
.thumb{
  width: 48px; height: 36px; object-fit: cover;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(15,23,42,.08);
}

/* 텍스트 */
.meta .name{ font-weight: 700; color: var(--ink); }
.meta .sub{ font-size: 12px; color: var(--muted); margin-top: 2px; }
.meta .sub b{ color:#2563eb; } /* 잔여 강조 */

/* 가격 */
.price{
  font-weight: 800;
  color: #111827;
  white-space: nowrap;
}
.price .unit{ font-size: 12px; color: var(--muted); margin-left: 4px; }

/* 민트 버튼 */
.btn.mint{
  height: 40px;
  padding: 0 16px;
  font-weight: 800;
  color: #0f2e23;
  border-radius: 10px;
  border: 1px solid #50b996;
  background: linear-gradient(180deg, var(--mint), var(--mint-2));
  transition: transform .15s ease, box-shadow .15s ease, opacity .15s ease;
}
.btn.mint:hover:not(:disabled){
  transform: translateY(-1px);
  box-shadow: 0 8px 16px rgba(89,202,166,.24);
}
.btn.mint:active:not(:disabled){ transform: translateY(0); }
.btn.mint:disabled{ opacity:.55; cursor:not-allowed; }

/* 입력 포커스 정리(기존 입력들) */
input.border.rounded{
  transition: box-shadow .15s ease, border-color .15s ease;
}
input.border.rounded:focus{
  outline: none;
  border-color: #60a5fa;
  box-shadow: 0 0 0 3px rgba(96,165,250,.35);
}

/* 모바일 보정 */
@media (max-width: 640px){
  .room-row{
    grid-template-columns: 48px 1fr;
    grid-template-areas:
      "thumb meta"
      "price button";
    row-gap: 8px;
  }
  .thumb{ grid-area: thumb; }
  .meta{ grid-area: meta; }
  .price{ grid-area: price; }
  .btn.mint{ grid-area: button; justify-self: start; }
}
</style>
