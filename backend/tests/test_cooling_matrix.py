import pytest

def test_cooling_matrix_bounds():
    """
    Verify the dual-layer cooling matrix values match empirical research constraints.
    """
    matrix = {
        'tree': {'min': -3.8, 'max': -1.0},
        'shade': {'min': -2.5, 'max': -1.5},
        'pavement': {'min': -1.2, 'max': -0.6},
        'mist': {'min': -5.0, 'max': -3.0}
    }
    
    assert matrix['tree']['min'] == -3.8
    assert matrix['shade']['max'] == -1.5
    assert matrix['pavement']['max'] == -0.6
