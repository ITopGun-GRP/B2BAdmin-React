import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import debounce from 'lodash.debounce';
import compose from 'recompose/compose';
import { createSelector } from 'reselect';

import LinearProgress from '../layout/LinearProgress';
import Labeled from './Labeled';
import addField from '../form/addField';
import { crudGetOne, crudGetMatching } from '../../actions/dataActions';
import {
    getPossibleReferences,
    getPossibleReferenceValues,
    getReferenceResource,
} from '../../reducer';
import { getStatusForInput as getDataStatus } from './referenceDataStatus';
import ReferenceError from './ReferenceError';
import translate from '../../i18n/translate';

const referenceSource = (resource, source) => `${resource}@${source}`;

const sanitizeRestProps = ({
    allowEmpty,
    basePath,
    choices,
    className,
    component,
    crudGetMatching,
    crudGetOne,
    defaultValue,
    filter,
    filterToQuery,
    formClassName,
    initializeForm,
    input,
    isRequired,
    label,
    locale,
    meta,
    onChange,
    options,
    optionValue,
    optionText,
    perPage,
    record,
    reference,
    referenceSource,
    resource,
    setFilter,
    setPagination,
    setSort,
    sort,
    source,
    textAlign,
    translate,
    translateChoice,
    validation,
    ...rest
}) => rest;

/**
 * An Input component for choosing a reference record. Useful for foreign keys.
 *
 * This component fetches the possible values in the reference resource
 * (using the `CRUD_GET_MATCHING` REST method), then delegates rendering
 * to a subcomponent, to which it passes the possible choices
 * as the `choices` attribute.
 *
 * Use it with a selector component as child, like `<AutocompleteInput>`,
 * `<SelectInput>`, or `<RadioButtonGroupInput>`.
 *
 * @example
 * export const CommentEdit = (props) => (
 *     <Edit {...props}>
 *         <SimpleForm>
 *             <ReferenceInput label="Post" source="post_id" reference="posts">
 *                 <AutocompleteInput optionText="title" />
 *             </ReferenceInput>
 *         </SimpleForm>
 *     </Edit>
 * );
 *
 * @example
 * export const CommentEdit = (props) => (
 *     <Edit {...props}>
 *         <SimpleForm>
 *             <ReferenceInput label="Post" source="post_id" reference="posts">
 *                 <SelectInput optionText="title" />
 *             </ReferenceInput>
 *         </SimpleForm>
 *     </Edit>
 * );
 *
 * By default, restricts the possible values to 25. You can extend this limit
 * by setting the `perPage` prop.
 *
 * @example
 * <ReferenceInput
 *      source="post_id"
 *      reference="posts"
 *      perPage={100}>
 *     <SelectInput optionText="title" />
 * </ReferenceInput>
 *
 * By default, orders the possible values by id desc. You can change this order
 * by setting the `sort` prop (an object with `field` and `order` properties).
 *
 * @example
 * <ReferenceInput
 *      source="post_id"
 *      reference="posts"
 *      sort={{ field: 'title', order: 'ASC' }}>
 *     <SelectInput optionText="title" />
 * </ReferenceInput>
 *
 * Also, you can filter the query used to populate the possible values. Use the
 * `filter` prop for that.
 *
 * @example
 * <ReferenceInput
 *      source="post_id"
 *      reference="posts"
 *      filter={{ is_published: true }}>
 *     <SelectInput optionText="title" />
 * </ReferenceInput>
 *
 * The enclosed component may filter results. ReferenceInput passes a `setFilter`
 * function as prop to its child component. It uses the value to create a filter
 * for the query - by default { q: [searchText] }. You can customize the mapping
 * searchText => searchQuery by setting a custom `filterToQuery` function prop:
 *
 * @example
 * <ReferenceInput
 *      source="post_id"
 *      reference="posts"
 *      filterToQuery={searchText => ({ title: searchText })}>
 *     <SelectInput optionText="title" />
 * </ReferenceInput>
 */
export class ReferenceInput extends Component {
    constructor(props) {
        super(props);
        const { perPage, sort, filter } = props;
        // stored as a property rather than state because we don't want redraw of async updates
        this.params = { pagination: { page: 1, perPage }, sort, filter };
        this.debouncedSetFilter = debounce(this.setFilter.bind(this), 500);
    }

    componentDidMount() {
        this.fetchReferenceAndOptions();
    }

    componentWillReceiveProps(nextProps) {
        if (this.props.record.id !== nextProps.record.id) {
            this.fetchReferenceAndOptions(nextProps);
        } else if (this.props.input.value !== nextProps.input.value) {
            this.fetchReference(nextProps);
        }
    }

    setFilter = filter => {
        if (filter !== this.params.filter) {
            this.params.filter = this.props.filterToQuery(filter);
            this.fetchOptions();
        }
    };

    setPagination = pagination => {
        if (pagination !== this.param.pagination) {
            this.param.pagination = pagination;
            this.fetchOptions();
        }
    };

    setSort = sort => {
        if (sort !== this.params.sort) {
            this.params.sort = sort;
            this.fetchOptions();
        }
    };

    fetchReference = (props = this.props) => {
        const { crudGetOne, input, reference } = props;
        const id = input.value;
        if (id) {
            crudGetOne(reference, id, null, false);
        }
    };

    fetchOptions = (props = this.props) => {
        const {
            crudGetMatching,
            filter: filterFromProps,
            reference,
            referenceSource,
            resource,
            source,
        } = props;
        const { pagination, sort, filter } = this.params;

        crudGetMatching(
            reference,
            referenceSource(resource, source),
            pagination,
            sort,
            { ...filterFromProps, ...filter }
        );
    };

    fetchReferenceAndOptions(props) {
        this.fetchReference(props);
        this.fetchOptions(props);
    }

    render() {
        const {
            classes,
            className,
            input,
            resource,
            label,
            source,
            referenceRecord,
            allowEmpty,
            matchingReferences,
            basePath,
            onChange,
            children,
            meta,
            options,
            translate,
            ...rest
        } = this.props;

        if (React.Children.count(children) !== 1) {
            throw new Error('<ReferenceInput> only accepts a single child');
        }

        const dataStatus = getDataStatus({
            input,
            matchingReferences,
            referenceRecord,
            translate,
        });

        const translatedLabel = translate(
            label || `resources.${resource}.fields.${source}`
        );

        if (dataStatus.waiting) {
            return (
                <Labeled
                    label={translatedLabel}
                    source={source}
                    resource={resource}
                    className={className}
                    {...sanitizeRestProps(rest)}
                >
                    <LinearProgress />
                </Labeled>
            );
        }

        if (dataStatus.error) {
            return (
                <ReferenceError
                    label={translatedLabel}
                    error={dataStatus.error}
                />
            );
        }

        return React.cloneElement(children, {
            allowEmpty,
            classes,
            className,
            input,
            label: translatedLabel,
            resource,
            meta: {
                ...meta,
                helperText: dataStatus.warning || false,
            },
            source,
            choices: dataStatus.choices,
            basePath,
            onChange,
            setFilter: this.debouncedSetFilter,
            setPagination: this.setPagination,
            setSort: this.setSort,
            translateChoice: false,
            options,
            ...sanitizeRestProps(rest),
        });
    }
}

ReferenceInput.propTypes = {
    allowEmpty: PropTypes.bool.isRequired,
    basePath: PropTypes.string,
    children: PropTypes.element.isRequired,
    className: PropTypes.string,
    classes: PropTypes.object,
    crudGetMatching: PropTypes.func.isRequired,
    crudGetOne: PropTypes.func.isRequired,
    filter: PropTypes.object,
    filterToQuery: PropTypes.func.isRequired,
    input: PropTypes.object.isRequired,
    label: PropTypes.string,
    matchingReferences: PropTypes.array,
    meta: PropTypes.object,
    onChange: PropTypes.func,
    perPage: PropTypes.number,
    record: PropTypes.object,
    reference: PropTypes.string.isRequired,
    referenceRecord: PropTypes.object,
    referenceSource: PropTypes.func.isRequired,
    resource: PropTypes.string.isRequired,
    sort: PropTypes.shape({
        field: PropTypes.string,
        order: PropTypes.oneOf(['ASC', 'DESC']),
    }),
    source: PropTypes.string,
    translate: PropTypes.func.isRequired,
};

ReferenceInput.defaultProps = {
    allowEmpty: false,
    filter: {},
    filterToQuery: searchText => ({ q: searchText }),
    matchingReferences: null,
    perPage: 25,
    sort: { field: 'id', order: 'DESC' },
    referenceRecord: null,
    referenceSource, // used in tests
};

const makeMapStateToProps = () =>
    createSelector(
        [
            getReferenceResource,
            getPossibleReferenceValues,
            (_, props) => props.input.value,
        ],
        (referenceState, possibleValues, inputId) => ({
            matchingReferences: getPossibleReferences(
                referenceState,
                possibleValues,
                [inputId]
            ),
            referenceRecord: referenceState && referenceState.data[inputId],
        })
    );

const ConnectedReferenceInput = compose(
    addField,
    translate,
    connect(makeMapStateToProps(), {
        crudGetOne,
        crudGetMatching,
    })
)(ReferenceInput);

ConnectedReferenceInput.defaultProps = {
    referenceSource, // used in real apps
};

export default ConnectedReferenceInput;
