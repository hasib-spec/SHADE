import pytest

def calculate_heri(temp, mean_temp, std_temp, svi, canopy):
    """
    HERI_i = [(T_2m,i - T_city) / σ_T] * SVI_i * (1 - C_i)
    """
    if std_temp == 0:
        return 0
    normalized_t = (temp - mean_temp) / std_temp
    heri = normalized_t * svi * (1 - canopy)
    return max(0, heri) # Assuming we floor at 0 for simplicity

def test_heri_computation():
    # High temp, high SVI, low canopy -> High HERI
    h_temp, mean, std, h_svi, l_canopy = 42, 38, 2, 0.9, 0.1
    heri_high = calculate_heri(h_temp, mean, std, h_svi, l_canopy)
    
    # Low temp, low SVI, high canopy -> Low HERI
    l_temp, l_svi, h_canopy = 36, 0.2, 0.8
    heri_low = calculate_heri(l_temp, mean, std, l_svi, h_canopy)
    
    assert heri_high > heri_low
    assert round(heri_high, 2) == 1.62 # ((42-38)/2) * 0.9 * 0.9 = 2 * 0.81
    assert heri_low == 0 # (36-38)/2 is negative -> floored to 0
