import { describe, expect, it } from 'vitest'

import { calcMidpoint } from './haversine'

describe('calcMidpoint', () => {
  it('출발지 0명이면 null 반환', () => {
    expect(calcMidpoint([])).toBeNull()
  })

  it('null/undefined만 있으면 null 반환', () => {
    expect(calcMidpoint([null, undefined, null])).toBeNull()
  })

  it('1명이면 그 사람 좌표 그대로 반환', () => {
    const result = calcMidpoint([{ lat: 37.49, lng: 127.02 }])
    expect(result?.lat).toBeCloseTo(37.49)
    expect(result?.lng).toBeCloseTo(127.02)
    expect(result?.excludedCount).toBe(0)
  })

  it('2명의 중간지점 계산', () => {
    const result = calcMidpoint([
      { lat: 37.49, lng: 127.02 }, // 강남
      { lat: 37.55, lng: 126.92 }, // 홍대
    ])
    expect(result?.lat).toBeCloseTo(37.52)
    expect(result?.lng).toBeCloseTo(126.97)
    expect(result?.excludedCount).toBe(0)
  })

  it('3명의 중간지점 계산', () => {
    const result = calcMidpoint([
      { lat: 37.49, lng: 127.02 }, // 강남
      { lat: 37.55, lng: 126.92 }, // 홍대
      { lat: 37.54, lng: 127.07 }, // 건대
    ])
    expect(result?.lat).toBeCloseTo(37.5267, 3)
    expect(result?.lng).toBeCloseTo(127.0033, 3)
    expect(result?.excludedCount).toBe(0)
  })

  it('출발지 미입력(null) 멤버는 계산에서 제외하고 excludedCount에 포함', () => {
    const result = calcMidpoint([
      { lat: 37.49, lng: 127.02 },
      null, // 미입력
      { lat: 37.55, lng: 126.92 },
      undefined, // 미입력
    ])
    expect(result?.excludedCount).toBe(2)
    expect(result?.lat).toBeCloseTo(37.52)
    expect(result?.lng).toBeCloseTo(126.97)
  })
})
